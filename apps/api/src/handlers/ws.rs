use crate::models::{RecentPromptItem, WsMessage};
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

    if let Err(e) = send_initial_data(&mut sender, &state, &stream_key).await {
        error!(
            "Failed to send initial data to client {}: {:?}",
            client_id, e
        );
        return;
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
                WsMessage::RecentPromptsUpdate {
                    stream_key: msg_stream_key,
                    ..
                } => msg_stream_key == &stream_key_clone,
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

    info!("Starting message receive loop for client {}", client_id);

    while let Some(result) = receiver.next().await {
        match result {
            Ok(msg) => match msg {
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
    let recent_entries = state.redis.get_recent_prompts(stream_key, 20).await?;

    let recent_prompts: Vec<RecentPromptItem> = recent_entries
        .iter()
        .map(|entry| RecentPromptItem {
            id: entry.prompt.id.clone(),
            text: entry.prompt.content.clone(),
            timestamp: entry.added_at.timestamp_millis(),
        })
        .collect();

    let initial_data = serde_json::json!({
        "type": "initial",
        "payload": {
            "currentPrompt": current_prompt,
            "recentPrompts": recent_prompts,
            "streamKey": stream_key,
        }
    });

    let json = serde_json::to_string(&initial_data)?;

    if let Err(e) = sender.send(Message::Text(json.into())).await {
        if e.to_string().to_lowercase().contains("broken pipe")
            || e.to_string().to_lowercase().contains("connection")
        {
            return Err(anyhow::anyhow!("broken pipe"));
        } else {
            return Err(e.into());
        }
    }

    Ok(())
}
