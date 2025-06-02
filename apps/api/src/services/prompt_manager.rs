use crate::models::WsMessage;
use crate::services::stream_api;
use crate::state::AppState;
use anyhow::Result;
use chrono::{DateTime, Duration, Utc};
use dashmap::DashMap;
use std::sync::Arc;
use tokio::time;
use tracing::{error, info};



pub async fn run(state: Arc<AppState>) -> Result<()> {
    info!("Prompt manager started");

    let mut interval = time::interval(time::Duration::from_secs(1));
    let failure_tracker: Arc<DashMap<String, DateTime<Utc>>> = Arc::new(DashMap::new());

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
