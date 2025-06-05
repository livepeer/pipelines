use crate::config::Config;
use crate::models::WsMessage;
use crate::services::redis::RedisClient;
use tokio::sync::broadcast;

pub struct AppState {
    pub redis: RedisClient,
    pub broadcast_tx: broadcast::Sender<WsMessage>,
    pub config: Config,
}

impl AppState {
    pub fn new(redis: RedisClient, config: Config) -> Self {
        let (broadcast_tx, _) = broadcast::channel(1000);

        Self {
            redis,
            broadcast_tx,
            config,
        }
    }

    pub async fn broadcast_message(&self, message: WsMessage) {
        if let Err(e) = self.broadcast_tx.send(message) {
            tracing::warn!("Failed to broadcast message: {}", e);
        }
    }
}
