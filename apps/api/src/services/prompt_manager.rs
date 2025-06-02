use crate::models::WsMessage;
use crate::state::AppState;
use anyhow::Result;
use chrono::{Duration, Utc};
use std::sync::Arc;
use tokio::time;
use tracing::{error, info};

pub async fn run(state: Arc<AppState>) -> Result<()> {
    info!("Prompt manager started");

    let mut interval = time::interval(time::Duration::from_secs(1));

    loop {
        interval.tick().await;

        match check_and_update_prompt(&state).await {
            Ok(updated) => {
                if updated {
                    info!("Prompt updated");
                }
            }
            Err(e) => {
                error!("Error in prompt manager: {}", e);
            }
        }
    }
}

async fn check_and_update_prompt(state: &Arc<AppState>) -> Result<bool> {
    let current_prompt = state.redis.get_current_prompt().await?;

    let should_update = match &current_prompt {
        None => true, // No current prompt, should get next one
        Some(current) => {
            // Check if 5 seconds have passed
            let elapsed = Utc::now() - current.started_at;
            elapsed >= Duration::seconds(5)
        }
    };

    if should_update {
        if let Some(next_prompt) = state.redis.get_next_prompt().await? {
            state.redis.set_current_prompt(next_prompt).await?;

            if let Some(new_current) = state.redis.get_current_prompt().await? {
                state
                    .broadcast_message(WsMessage::CurrentPrompt(Some(new_current)))
                    .await;

                return Ok(true);
            }
        }
    }

    Ok(false)
}
