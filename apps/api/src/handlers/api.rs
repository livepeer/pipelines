use crate::models::{Prompt, SubmitPromptRequest, SubmitPromptResponse, WsMessage};
use crate::state::AppState;
use axum::{
    extract::{Json, Query, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Deserialize;
use std::sync::Arc;
use tracing::info;
use uuid::Uuid;

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

    // TODO: Add NSFW Filter

    let was_censored = false;

    let prompt = Prompt::new(
        req.text,
        if req.is_user {
            "user".to_string()
        } else {
            "bot".to_string()
        },
        req.session_id,
        req.seed,
        req.stream_key.clone(),
    );

    let prompt_id = prompt.id.clone();

    let queue_position = state.redis.add_prompt_to_queue(prompt).await.map_err(|e| {
        tracing::error!("Failed to add prompt to queue: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    info!(
        "New prompt submitted: {} (queue position: {})",
        prompt_id, queue_position
    );

    let queue_entries = state
        .redis
        .get_prompt_queue(&req.stream_key, 20)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get updated prompt queue: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let prompt_queue: Vec<serde_json::Value> = queue_entries
        .iter()
        .map(|entry| {
            serde_json::json!({
                "text": entry.prompt.content,
                "seed": entry.prompt.avatar_seed,
                "isUser": entry.prompt.submitted_by == "user",
                "timestamp": entry.added_at.timestamp_millis(),
                "sessionId": entry.prompt.session_id,
                "streamKey": req.stream_key
            })
        })
        .collect();

    // Get current state for broadcast
    let current_prompt = state
        .redis
        .get_current_prompt(&req.stream_key)
        .await
        .ok()
        .flatten();

    let displayed_prompts = if let Some(ref current) = current_prompt {
        vec![current.prompt.content.clone()]
    } else {
        vec![]
    };

    let prompt_avatar_seeds: Vec<String> = if let Some(ref current) = current_prompt {
        vec![current.prompt.avatar_seed.clone()]
    } else {
        vec![]
    };

    let user_prompt_indices: Vec<bool> = if let Some(ref current) = current_prompt {
        vec![current.prompt.submitted_by == "user"]
    } else {
        vec![]
    };

    let prompt_session_ids: Vec<String> = if let Some(ref current) = current_prompt {
        vec![current.prompt.session_id.clone()]
    } else {
        vec![]
    };

    let highlighted_since = if let Some(ref current) = current_prompt {
        current.started_at.timestamp_millis()
    } else {
        0
    };

    let prompt_state = serde_json::json!({
        "promptQueue": prompt_queue,
        "displayedPrompts": displayed_prompts,
        "promptAvatarSeeds": prompt_avatar_seeds,
        "userPromptIndices": user_prompt_indices,
        "promptSessionIds": prompt_session_ids,
        "highlightedSince": highlighted_since,
        "streamKey": req.stream_key,
    });

    let ws_msg = WsMessage::StateUpdate {
        prompt_state,
        stream_key: req.stream_key.clone(),
    };

    state.broadcast_message(ws_msg).await;

    Ok(Json(SubmitPromptResponse {
        id: prompt_id,
        message: "Prompt submitted successfully".to_string(),
        was_censored,
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

    let queue_entries = state
        .redis
        .get_prompt_queue(&params.stream_key, 20)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get prompt queue: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let prompt_queue: Vec<String> = queue_entries
        .iter()
        .map(|entry| entry.prompt.content.clone())
        .collect();

    let displayed_prompts = if let Some(ref current) = current_prompt {
        vec![current.prompt.content.clone()]
    } else {
        vec![]
    };

    let prompt_avatar_seeds: Vec<String> = if let Some(ref current) = current_prompt {
        vec![current.prompt.avatar_seed.clone()]
    } else {
        vec![]
    };

    let user_prompt_indices: Vec<bool> = if let Some(ref current) = current_prompt {
        vec![current.prompt.submitted_by == "user"]
    } else {
        vec![]
    };

    let prompt_session_ids: Vec<String> = if let Some(ref current) = current_prompt {
        vec![current.prompt.session_id.clone()]
    } else {
        vec![]
    };

    let highlighted_since = if let Some(ref current) = current_prompt {
        current.started_at.timestamp_millis()
    } else {
        0
    };

    Ok(Json(serde_json::json!({
        "promptQueue": prompt_queue,
        "displayedPrompts": displayed_prompts,
        "promptAvatarSeeds": prompt_avatar_seeds,
        "userPromptIndices": user_prompt_indices,
        "promptSessionIds": prompt_session_ids,
        "highlightedSince": highlighted_since,
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

    let random_prompts = vec![
        "A serene landscape with mountains and a lake",
        "A futuristic city with flying cars",
        "A magical forest with glowing mushrooms",
        "An underwater scene with colorful coral reefs",
        "A steampunk workshop with intricate machinery",
        "A cozy cabin in a snowy forest",
        "A vibrant sunset over the ocean",
        "A mystical castle floating in the clouds",
        "A bustling marketplace in an ancient city",
        "A peaceful zen garden with cherry blossoms",
    ];

    let random_index = rand::random::<usize>() % random_prompts.len();
    let prompt_text = random_prompts[random_index];

    let prompt = Prompt::new(
        prompt_text.to_string(),
        "bot".to_string(),
        format!("bot-{}", Uuid::new_v4()),
        format!("bot-{}", rand::random::<u32>()),
        params.stream_key.clone(),
    );

    let prompt_id = prompt.id.clone();

    let queue_position = state.redis.add_prompt_to_queue(prompt).await.map_err(|e| {
        tracing::error!("Failed to add random prompt to queue: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    info!(
        "Random prompt added: {} (queue position: {})",
        prompt_id, queue_position
    );

    let queue_entries = state
        .redis
        .get_prompt_queue(&params.stream_key, 20)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get updated prompt queue: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let prompt_queue: Vec<serde_json::Value> = queue_entries
        .iter()
        .map(|entry| {
            serde_json::json!({
                "text": entry.prompt.content,
                "seed": entry.prompt.avatar_seed,
                "isUser": entry.prompt.submitted_by == "user",
                "timestamp": entry.added_at.timestamp_millis(),
                "sessionId": entry.prompt.session_id,
                "streamKey": params.stream_key
            })
        })
        .collect();

    let current_prompt = state
        .redis
        .get_current_prompt(&params.stream_key)
        .await
        .ok()
        .flatten();

    let displayed_prompts = if let Some(ref current) = current_prompt {
        vec![current.prompt.content.clone()]
    } else {
        vec![]
    };

    let prompt_avatar_seeds: Vec<String> = if let Some(ref current) = current_prompt {
        vec![current.prompt.avatar_seed.clone()]
    } else {
        vec![]
    };

    let user_prompt_indices: Vec<bool> = if let Some(ref current) = current_prompt {
        vec![current.prompt.submitted_by == "user"]
    } else {
        vec![]
    };

    let prompt_session_ids: Vec<String> = if let Some(ref current) = current_prompt {
        vec![current.prompt.session_id.clone()]
    } else {
        vec![]
    };

    let highlighted_since = if let Some(ref current) = current_prompt {
        current.started_at.timestamp_millis()
    } else {
        0
    };

    let prompt_state = serde_json::json!({
        "promptQueue": prompt_queue,
        "displayedPrompts": displayed_prompts,
        "promptAvatarSeeds": prompt_avatar_seeds,
        "userPromptIndices": user_prompt_indices,
        "promptSessionIds": prompt_session_ids,
        "highlightedSince": highlighted_since,
        "streamKey": params.stream_key,
    });

    let ws_msg = WsMessage::StateUpdate {
        prompt_state,
        stream_key: params.stream_key.clone(),
    };

    state.broadcast_message(ws_msg).await;

    Ok(Json(serde_json::json!({
        "id": prompt_id,
        "message": "Random prompt added successfully",
        "queue_position": queue_position,
    })))
}
