use crate::models::{ChatMessage, InitialData, WsMessage};
use crate::state::AppState;
use axum::{
    extract::{
        State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    response::IntoResponse,
};
use futures::{sink::SinkExt, stream::StreamExt};
use std::sync::Arc;
use tokio::sync::mpsc;
use tracing::{error, info};
use uuid::Uuid;

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: Arc<AppState>) {
    let client_id = Uuid::new_v4().to_string();
    let (mut sender, mut receiver) = socket.split();

    let (tx, mut rx) = mpsc::channel::<String>(100);

    info!("Client {} connected", client_id);

    if let Err(e) = send_initial_data(&mut sender, &state).await {
        error!("Failed to send initial data to client {}: {}", client_id, e);
    }

    let mut broadcast_rx = state.broadcast_tx.subscribe();

    let tx_clone = tx.clone();
    let broadcast_task = tokio::spawn(async move {
        while let Ok(msg) = broadcast_rx.recv().await {
            if let Ok(json) = serde_json::to_string(&msg) {
                if tx_clone.send(json).await.is_err() {
                    break;
                }
            }
        }
    });

    let send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(Message::Text(msg.into())).await.is_err() {
                break;
            }
        }
    });

    while let Some(Ok(msg)) = receiver.next().await {
        match msg {
            Message::Text(text) => {
                if let Ok(chat_msg) = serde_json::from_str::<serde_json::Value>(&text) {
                    if let (Some(username), Some(content)) = (
                        chat_msg.get("username").and_then(|v| v.as_str()),
                        chat_msg.get("content").and_then(|v| v.as_str()),
                    ) {
                        let message = ChatMessage::new(username.to_string(), content.to_string());

                        if let Err(e) = state.redis.add_chat_message(&message).await {
                            error!("Failed to save chat message: {}", e);
                        }

                        state.broadcast_message(WsMessage::Chat(message)).await;
                    }
                }
            }
            Message::Close(_) => break,
            _ => {}
        }
    }

    broadcast_task.abort();
    send_task.abort();
    info!("Client {} disconnected", client_id);
}

async fn send_initial_data(
    sender: &mut futures::stream::SplitSink<WebSocket, Message>,
    state: &AppState,
) -> anyhow::Result<()> {
    let current_prompt = state.redis.get_current_prompt().await?;
    let recent_messages = state.redis.get_recent_messages(100).await?;

    let initial_data = InitialData {
        current_prompt,
        recent_messages,
    };

    let message = WsMessage::InitialData(initial_data);
    let json = serde_json::to_string(&message)?;
    sender.send(Message::Text(json.into())).await?;

    Ok(())
}
