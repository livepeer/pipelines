use anyhow::Result;
use axum::{
    Router,
    routing::{get, post},
};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing::info;

mod config;
mod handlers;
mod models;
mod services;
mod state;

use config::Config;
use handlers::{api, ws};
use services::{prompt_manager, redis::RedisClient};
use state::AppState;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    let config = Config::from_env()?;
    info!("Configuration loaded");

    let redis_client = RedisClient::new(&config.redis_url).await?;
    info!("Connected to Redis");

    let app_state = Arc::new(AppState::new(redis_client));

    let prompt_manager_state = app_state.clone();
    tokio::spawn(async move {
        if let Err(e) = prompt_manager::run(prompt_manager_state).await {
            tracing::error!("Prompt manager error: {}", e);
        }
    });

    let app = Router::new()
        .route("/health", get(|| async { "OK" }))
        .route("/prompt", post(api::submit_prompt))
        .route("/chat/initial-data", get(api::get_initial_data))
        .route("/ws", get(ws::websocket_handler))
        .layer(CorsLayer::permissive())
        .with_state(app_state);

    let addr = SocketAddr::from(([0, 0, 0, 0], config.server_port));
    info!("Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
