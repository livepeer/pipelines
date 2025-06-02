use crate::models::{ChatMessage, WsMessage};
use crate::state::AppState;
use axum::{
    extract::{
        Query, State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    response::IntoResponse,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::Deserialize;
use std::sync::Arc;
use tokio::sync::mpsc;
use tracing::{error, info};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct WsQuery {
    #[serde(rename = "streamKey")]
    stream_key: Option<String>,
}

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
    Query(params): Query<WsQuery>,
) -> impl IntoResponse {
    let stream_key = params.stream_key.unwrap_or_else(|| {
        state
            .config
            .stream_keys
            .first()
            .cloned()
            .unwrap_or_default()
    });

    ws.on_upgrade(move |socket| handle_socket(socket, state, stream_key))
}

async fn handle_socket(socket: WebSocket, state: Arc<AppState>, stream_key: String) {
    let client_id = Uuid::new_v4().to_string();
    info!(
        "Client {} attempting to connect to stream {}",
        client_id, stream_key
    );

    let (mut sender, mut receiver) = socket.split();

    let (tx, mut rx) = mpsc::channel::<String>(100);

    info!("Client {} connected to stream {}", client_id, stream_key);

    match send_initial_data(&mut sender, &state, &stream_key).await {
        Ok(_) => {
            info!("Successfully sent initial data to client {}", client_id);
        }
        Err(e) => {
            error!(
                "Failed to send initial data to client {}: {:?}",
                client_id, e
            );
            let error_msg = serde_json::json!({
                "type": "Error",
                "payload": {
                    "message": format!("Failed to initialize connection: {}", e)
                }
            });
            if let Ok(json) = serde_json::to_string(&error_msg) {
                let _ = sender.send(Message::Text(json.into())).await;
            }
            return; // Exit early on error
        }
    }

    let mut broadcast_rx = state.broadcast_tx.subscribe();

    let tx_clone = tx.clone();
    let stream_key_clone = stream_key.clone();
    let client_id_clone = client_id.clone();
    let broadcast_task = tokio::spawn(async move {
        info!("Broadcast task started for client {}", client_id_clone);
        while let Ok(msg) = broadcast_rx.recv().await {
            let should_send = match &msg {
                WsMessage::CurrentPrompt {
                    stream_key: msg_stream_key,
                    ..
                } => msg_stream_key == &stream_key_clone,
                WsMessage::StateUpdate {
                    stream_key: msg_stream_key,
                    ..
                } => msg_stream_key == &stream_key_clone,
                WsMessage::Chat(_) => {
                    // TODO: Filter by stream key
                    true
                }
                WsMessage::InitialData(data) => data.stream_key == stream_key_clone,
                WsMessage::Error { .. } => true, // Errors should always be sent
            };

            if should_send {
                if let Ok(json) = serde_json::to_string(&msg) {
                    if tx_clone.send(json).await.is_err() {
                        info!(
                            "Broadcast task ending for client {} - channel closed",
                            client_id_clone
                        );
                        break;
                    }
                }
            }
        }
    });

    let client_id_clone = client_id.clone();
    let send_task = tokio::spawn(async move {
        info!("Send task started for client {}", client_id_clone);
        while let Some(msg) = rx.recv().await {
            if sender.send(Message::Text(msg.into())).await.is_err() {
                info!(
                    "Send task ending for client {} - WebSocket closed",
                    client_id_clone
                );
                break;
            }
        }
    });

    let state_clone = state.clone();
    let stream_key_clone = stream_key.clone();

    info!("Starting message receive loop for client {}", client_id);

    while let Some(result) = receiver.next().await {
        match result {
            Ok(msg) => match msg {
                Message::Text(text) => {
                    info!("Received text message from client {}: {}", client_id, text);
                    if let Ok(chat_data) = serde_json::from_str::<serde_json::Value>(&text) {
                        if let (Some(username), Some(content), session_id, avatar_seed) = (
                            chat_data.get("username").and_then(|v| v.as_str()),
                            chat_data.get("content").and_then(|v| v.as_str()),
                            chat_data
                                .get("sessionId")
                                .and_then(|v| v.as_str())
                                .map(|s| s.to_string()),
                            chat_data
                                .get("avatarSeed")
                                .and_then(|v| v.as_str())
                                .map(|s| s.to_string()),
                        ) {
                            let session_id = session_id.unwrap_or_else(|| client_id.clone());
                            let avatar_seed =
                                avatar_seed.unwrap_or_else(|| format!("user-{}", &session_id[..8]));

                            let message = ChatMessage::new(
                                username.to_string(),
                                content.to_string(),
                                session_id,
                                avatar_seed,
                            );

                            if let Err(e) = state_clone
                                .redis
                                .add_chat_message(&message, &stream_key_clone)
                                .await
                            {
                                error!("Failed to save chat message: {}", e);
                            }

                            state_clone
                                .broadcast_message(WsMessage::Chat(message))
                                .await;
                        }
                    }
                }
                Message::Close(_) => {
                    info!("Client {} sent close message", client_id);
                    break;
                }
                Message::Ping(_) => {
                    info!("Received ping from client {}", client_id);
                }
                Message::Pong(_) => {
                    info!("Received pong from client {}", client_id);
                }
                _ => {}
            },
            Err(e) => {
                error!("WebSocket error for client {}: {:?}", client_id, e);
                break;
            }
        }
    }

    broadcast_task.abort();
    send_task.abort();
    info!(
        "Client {} disconnected from stream {}",
        client_id, stream_key
    );
}

async fn send_initial_data(
    sender: &mut futures::stream::SplitSink<WebSocket, Message>,
    state: &AppState,
    stream_key: &str,
) -> anyhow::Result<()> {
    let current_prompt = state.redis.get_current_prompt(stream_key).await?;

    let recent_messages = state
        .redis
        .get_recent_messages(stream_key, state.config.max_chat_messages)
        .await?;

    let queue_entries = state.redis.get_prompt_queue(stream_key, 20).await?;

    // Convert queue entries to PromptItem format
    let prompt_queue: Vec<serde_json::Value> = queue_entries
        .iter()
        .map(|entry| {
            serde_json::json!({
                "text": entry.prompt.content,
                "seed": entry.prompt.avatar_seed,
                "isUser": entry.prompt.submitted_by == "user",
                "timestamp": entry.added_at.timestamp_millis(),
                "sessionId": entry.prompt.session_id,
                "streamKey": stream_key
            })
        })
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

    let initial_data = serde_json::json!({
        "type": "initial",
        "payload": {
            "promptState": {
                "promptQueue": prompt_queue,
                "displayedPrompts": displayed_prompts,
                "promptAvatarSeeds": prompt_avatar_seeds,
                "userPromptIndices": user_prompt_indices,
                "promptSessionIds": prompt_session_ids,
                "highlightedSince": highlighted_since,
                "streamKey": stream_key,
            },
            "recentMessages": recent_messages,
            "currentPrompt": current_prompt,
        }
    });

    let json = serde_json::to_string(&initial_data)?;
    sender.send(Message::Text(json.into())).await?;

    Ok(())
}
