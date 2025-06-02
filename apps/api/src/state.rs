use crate::models::WsMessage;
use crate::services::redis::RedisClient;
use tokio::sync::broadcast;

pub struct AppState {
    pub redis: RedisClient,
    pub broadcast_tx: broadcast::Sender<WsMessage>,
}

impl AppState {
    pub fn new(redis: RedisClient) -> Self {
        let (broadcast_tx, _) = broadcast::channel(100);

        Self {
            redis,
            broadcast_tx,
        }
    }

    pub async fn broadcast_message(&self, message: WsMessage) {
        if let Err(e) = self.broadcast_tx.send(message) {
            tracing::warn!("Failed to broadcast message: {}", e);
        }
    }
}
