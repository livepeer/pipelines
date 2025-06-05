use crate::models::{
    Prompt, RecentPromptItem, SubmitPromptRequest, SubmitPromptResponse, WsMessage,
};
use crate::state::AppState;
use axum::{
    extract::{Json, Query, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Deserialize;
use std::sync::Arc;
use tracing::info;

#[derive(Deserialize)]
pub struct PromptQuery {
    #[serde(rename = "streamKey")]
    stream_key: String,
}

pub async fn submit_prompt(
    State(state): State<Arc<AppState>>,
    Json(req): Json<SubmitPromptRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    if req.text.trim().is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    if !state.config.stream_keys.contains(&req.stream_key) {
        return Err(StatusCode::BAD_REQUEST);
    }

    let prompt = Prompt::new(req.text, req.stream_key.clone());
    let prompt_id = prompt.id.clone();

    let queue_position = state.redis.add_prompt_to_queue(prompt).await.map_err(|e| {
        tracing::error!("Failed to add prompt to queue: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    info!(
        "New prompt submitted: {} (queue position: {})",
        prompt_id, queue_position
    );

    if let Ok(recent_entries) = state.redis.get_recent_prompts(&req.stream_key, 20).await {
        let recent_prompts: Vec<RecentPromptItem> = recent_entries
            .iter()
            .map(|entry| RecentPromptItem {
                id: entry.prompt.id.clone(),
                text: entry.prompt.content.clone(),
                timestamp: entry.added_at.timestamp_millis(),
            })
            .collect();

        let ws_msg = WsMessage::RecentPromptsUpdate {
            recent_prompts,
            stream_key: req.stream_key.clone(),
        };

        state.broadcast_message(ws_msg).await;
    }

    Ok(Json(SubmitPromptResponse {
        id: prompt_id,
        message: "Prompt submitted successfully".to_string(),
        queue_position,
    }))
}

pub async fn get_prompt_state(
    State(state): State<Arc<AppState>>,
    Query(params): Query<PromptQuery>,
) -> Result<impl IntoResponse, StatusCode> {
    if !state.config.stream_keys.contains(&params.stream_key) {
        return Err(StatusCode::BAD_REQUEST);
    }

    let current_prompt = state
        .redis
        .get_current_prompt(&params.stream_key)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get current prompt: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let recent_entries = state
        .redis
        .get_recent_prompts(&params.stream_key, 20)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get recent prompts: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let recent_prompts: Vec<RecentPromptItem> = recent_entries
        .iter()
        .map(|entry| RecentPromptItem {
            id: entry.prompt.id.clone(),
            text: entry.prompt.content.clone(),
            timestamp: entry.added_at.timestamp_millis(),
        })
        .collect();

    Ok(Json(serde_json::json!({
        "currentPrompt": current_prompt,
        "recentPrompts": recent_prompts,
        "streamKey": params.stream_key,
    })))
}

pub async fn add_random_prompt(
    State(state): State<Arc<AppState>>,
    Query(params): Query<PromptQuery>,
) -> Result<impl IntoResponse, StatusCode> {
    if !state.config.stream_keys.contains(&params.stream_key) {
        return Err(StatusCode::BAD_REQUEST);
    }

    let random_prompts = ["A serene landscape with mountains and a lake",
        "A futuristic city with flying cars",
        "A magical forest with glowing mushrooms",
        "An underwater scene with colorful coral reefs",
        "A steampunk workshop with intricate machinery",
        "A cozy cabin in a snowy forest",
        "A vibrant sunset over the ocean",
        "A mystical castle floating in the clouds",
        "A bustling marketplace in an ancient city",
        "A peaceful zen garden with cherry blossoms"];

    let random_index = rand::random::<usize>() % random_prompts.len();
    let prompt_text = random_prompts[random_index];

    let prompt = Prompt::new(prompt_text.to_string(), params.stream_key.clone());
    let prompt_id = prompt.id.clone();

    let queue_position = state.redis.add_prompt_to_queue(prompt).await.map_err(|e| {
        tracing::error!("Failed to add random prompt to queue: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    info!(
        "Random prompt added: {} (queue position: {})",
        prompt_id, queue_position
    );

    if let Ok(recent_entries) = state.redis.get_recent_prompts(&params.stream_key, 20).await {
        let recent_prompts: Vec<RecentPromptItem> = recent_entries
            .iter()
            .map(|entry| RecentPromptItem {
                id: entry.prompt.id.clone(),
                text: entry.prompt.content.clone(),
                timestamp: entry.added_at.timestamp_millis(),
            })
            .collect();

        let ws_msg = WsMessage::RecentPromptsUpdate {
            recent_prompts,
            stream_key: params.stream_key.clone(),
        };

        state.broadcast_message(ws_msg).await;
    }

    Ok(Json(serde_json::json!({
        "id": prompt_id,
        "message": "Random prompt added successfully",
        "queue_position": queue_position,
    })))
}
