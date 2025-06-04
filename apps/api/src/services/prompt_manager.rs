use crate::models::{Prompt, WsMessage};
use crate::services::stream_api;
use crate::state::AppState;
use anyhow::Result;
use chrono::{DateTime, Duration, Utc};
use dashmap::DashMap;
use std::sync::Arc;
use tokio::time;
use tracing::{error, info};

const RANDOM_PROMPTS: &[&str] = &[
    "hyperrealistic portrait of an alien queen --quality 3",
    "fantasy castle floating among clouds at sunset --creativity 0.8",
    "cybernetic ((animal)) with glowing parts --quality 2",
    "dreamlike surreal landscape with impossible physics --creativity 0.9",
    "ancient ruins overgrown with (((luminescent plants))) --quality 3",
    "deep sea creature inspired by ((bioluminescent)) life --quality 2.5",
    "clockwork automaton with intricate mechanical details --creativity 0.8",
    "volcanic landscape with rivers of glowing (((molten lava))) --quality 3",
    "cosmic deity with stars and galaxies as part of its form --creativity 0.9",
    "psychedelic dreamscape with fractals and impossible colors --quality 2.5",
    "biomechanical fusion of nature and ((advanced technology)) --creativity 0.8",
    "crystal palace with rainbow light refractions --quality 3",
    "ancient temple in a jungle with mystical fog --quality 2.8",
    "futuristic city with hovering vehicles and holographic ads --creativity 0.9",
    "magical underwater kingdom with merfolk architecture --quality 3",
    "cosmic gateway with swirling energy patterns --creativity 0.85",
    "crystal forest with rainbow light refractions --quality 2.7",
    "surreal dreamscape with floating islands and impossible physics --creativity 0.95",
    "ancient mechanical clockwork city --quality 3",
    "bioluminescent deep sea creatures in the abyss --creativity 0.8",
    "floating islands with waterfalls cascading into the void --quality 2.9",
    "enchanted forest with magical creatures and fairy lights --creativity 0.75",
    "cybernetic dragon with glowing circuit patterns --quality 3",
];

pub async fn run(state: Arc<AppState>) -> Result<()> {
    info!("Prompt manager started");

    let mut interval = time::interval(time::Duration::from_secs(1));
    let failure_tracker: Arc<DashMap<String, DateTime<Utc>>> = Arc::new(DashMap::new());
    let last_prompt_activity: Arc<DashMap<String, DateTime<Utc>>> = Arc::new(DashMap::new());

    loop {
        interval.tick().await;

        for stream_key in &state.config.stream_keys {
            {
                if let Some(last_failure_entry) = failure_tracker.get(stream_key) {
                    let last_failure = *last_failure_entry;
                    let cooldown_duration = Duration::seconds(20);
                    if Utc::now() - last_failure < cooldown_duration {
                        continue;
                    }
                }
            }

            match check_and_add_random_prompt_if_needed(&state, stream_key, &last_prompt_activity)
                .await
            {
                Ok(added) => {
                    if added {
                        info!("Random prompt added for inactive stream: {}", stream_key);
                        last_prompt_activity.insert(stream_key.to_string(), Utc::now());
                    }
                }
                Err(e) => {
                    error!(
                        "Error adding random prompt for stream {}: {}",
                        stream_key, e
                    );
                }
            }

            match check_and_update_prompt(&state, stream_key).await {
                Ok(updated) => {
                    if updated {
                        info!("Prompt updated for stream: {}", stream_key);
                    }
                    failure_tracker.remove(stream_key);
                }
                Err(e) => {
                    error!("Error in prompt manager for stream {}: {}", stream_key, e);
                    failure_tracker.insert(stream_key.to_string(), Utc::now());
                }
            }
        }
    }
}

async fn check_and_add_random_prompt_if_needed(
    state: &Arc<AppState>,
    stream_key: &str,
    last_activity_tracker: &Arc<DashMap<String, DateTime<Utc>>>,
) -> Result<bool> {
    let queue_length = state.redis.get_queue_length(stream_key).await?;

    if queue_length > 0 {
        last_activity_tracker.insert(stream_key.to_string(), Utc::now());
        return Ok(false);
    }

    let now = Utc::now();
    let should_add_random = match last_activity_tracker.get(stream_key) {
        Some(last_activity_entry) => {
            let last_activity = *last_activity_entry;
            let idle_duration = now - last_activity;
            idle_duration >= Duration::seconds(20)
        }
        None => {
            last_activity_tracker.insert(stream_key.to_string(), now);
            false
        }
    };

    if should_add_random {
        let random_index = (now.timestamp_millis() as usize) % RANDOM_PROMPTS.len();
        let random_prompt_text = RANDOM_PROMPTS[random_index];

        let prompt = Prompt::new(random_prompt_text.to_string(), stream_key.to_string());
        state.redis.add_prompt_to_queue(prompt).await?;
        info!(
            "Added random prompt to stream {}: {}",
            stream_key, random_prompt_text
        );
        return Ok(true);
    }

    Ok(false)
}

async fn check_and_update_prompt(state: &Arc<AppState>, stream_key: &str) -> Result<bool> {
    let current_prompt = state.redis.get_current_prompt(stream_key).await?;

    let should_update = match &current_prompt {
        None => true,
        Some(current) => {
            let elapsed = Utc::now() - current.started_at;
            elapsed >= Duration::seconds(state.config.prompt_min_duration_secs as i64)
        }
    };

    if !should_update {
        return Ok(false);
    }

    if let Some(next_entry) = state.redis.get_next_prompt(stream_key).await? {
        let next_prompt = next_entry.prompt;

        state.redis.set_current_prompt(next_prompt.clone()).await?;

        let gateway_host = state
            .config
            .stream_keys
            .iter()
            .position(|key| key == stream_key)
            .and_then(|index| state.config.gateway_hosts.get(index))
            .ok_or_else(|| {
                anyhow::anyhow!("No gateway host found for stream key: {}", stream_key)
            })?;

        if let Err(e) = stream_api::apply_prompt_to_stream(
            &next_prompt.content,
            stream_key,
            gateway_host,
            &state.config.stream_api_user,
            &state.config.stream_api_password,
        )
        .await
        {
            error!("Failed to apply prompt to stream {}: {}", stream_key, e);
        }

        if let Some(new_current) = state.redis.get_current_prompt(stream_key).await? {
            state
                .broadcast_message(WsMessage::CurrentPrompt {
                    prompt: Some(new_current),
                    stream_key: stream_key.to_string(),
                })
                .await;

            let queue_length = state.redis.get_queue_length(stream_key).await?;
            info!("Stream {} - Queue length: {}", stream_key, queue_length);
        }
    } else if current_prompt.is_some() {
        // keep the last prompt active
    }

    Ok(true)
}
