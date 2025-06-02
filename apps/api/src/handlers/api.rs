use crate::models::{InitialData, Prompt, SubmitPromptRequest, SubmitPromptResponse};
use crate::state::AppState;
use axum::{
    extract::{Json, State},
    http::StatusCode,
    response::IntoResponse,
};
use std::sync::Arc;
use tracing::info;

pub async fn submit_prompt(
    State(state): State<Arc<AppState>>,
    Json(req): Json<SubmitPromptRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    if req.content.trim().is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let prompt = Prompt::new(req.content, req.username);
    let prompt_id = prompt.id.clone();

    state
        .redis
        .add_prompt_to_queue(prompt)
        .await
        .map_err(|e| {
            tracing::error!("Failed to add prompt to queue: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    info!("New prompt submitted: {}", prompt_id);

    Ok(Json(SubmitPromptResponse {
        id: prompt_id,
        message: "Prompt submitted successfully".to_string(),
    }))
}

pub async fn get_initial_data(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    let current_prompt = state
        .redis
        .get_current_prompt()
        .await
        .map_err(|e| {
            tracing::error!("Failed to get current prompt: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let recent_messages = state
        .redis
        .get_recent_messages(100)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get recent messages: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(InitialData {
        current_prompt,
        recent_messages,
    }))
} 