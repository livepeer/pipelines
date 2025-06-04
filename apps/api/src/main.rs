use anyhow::Result;
use axum::{
    Router,
    routing::{get, post, put},
};
use rand::seq::SliceRandom;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing::{error, info};

mod config;
mod handlers;
mod models;
mod services;
mod state;

use config::Config;
use handlers::{api, ws};
use services::{prompt_manager, redis::RedisClient};
use state::AppState;

async fn initialize_redis_with_default_prompts(
    redis: &RedisClient,
    stream_keys: &[String],
) -> Result<()> {
    let mut initial_prompts = vec![
        "cyberpunk cityscape with neon lights --quality 3",
        "underwater scene with ((bioluminescent)) creatures --creativity 0.8",
        "forest with magical creatures and (((glowing plants))) --quality 2",
        "cosmic nebula with vibrant colors --creativity 0.7",
        "futuristic landscape with floating islands --quality 3",
        "post-apocalyptic desert with abandoned technology --quality 2.5",
        "steampunk airship battle in stormy skies --creativity 0.9",
        "crystalline cave with ((magical)) light reflections --quality 3",
        "ancient library with impossible architecture --creativity 0.8",
        "digital realm with data visualized as (((geometric structures))) --quality 2.5",
        "northern lights over snow-covered mountains --creativity 0.7",
        "microscopic view of exotic (((alien cells))) --quality 3",
        "ancient temple in a jungle with mystical fog --quality 2.8",
        "futuristic city with hovering vehicles and holographic ads --creativity 0.9",
        "magical underwater kingdom with merfolk architecture --quality 3",
        "cosmic gateway with swirling energy patterns --creativity 0.85",
        "crystal forest with rainbow light refractions --quality 2.7",
        "surreal dreamscape with floating islands and impossible physics --creativity 0.95",
        "ancient mechanical clockwork city --quality 3",
        "bioluminescent deep sea creatures in the abyss --creativity 0.8",
        "floating islands with waterfalls cascading into the void --quality 2.9",
        "enchanted forest with magical creatures and fairy lights --creativity 0.75",
        "cybernetic dragon with glowing circuit patterns --quality 3",
    ];

    use crate::models::Prompt;

    for stream_key in stream_keys {
        let recent_prompts = redis.get_recent_prompts(stream_key, 1).await?;
        if recent_prompts.is_empty() {
            info!(
                "No chat history found for stream {}, initializing with default prompts",
                stream_key
            );

            let mut rng = rand::thread_rng();
            initial_prompts.shuffle(&mut rng);

            for prompt_text in &initial_prompts {
                let prompt = Prompt::new(prompt_text.to_string(), stream_key.clone());

                redis.add_prompt_to_queue(prompt).await?;
            }

            info!(
                "Added {} shuffled initial prompts to stream {}",
                initial_prompts.len(),
                stream_key
            );
        } else {
            info!("Stream {} already has chat history", stream_key);
        }
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    let config = Config::from_env()?;
    info!("Configuration loaded");

    let redis_client = RedisClient::new(&config.redis_url).await?;
    info!("Connected to Redis");

    if let Err(e) = initialize_redis_with_default_prompts(&redis_client, &config.stream_keys).await
    {
        error!("Failed to initialize Redis with default prompts: {}", e);
    }

    let app_state = Arc::new(AppState::new(redis_client, config));

    let prompt_manager_state = app_state.clone();
    tokio::spawn(async move {
        if let Err(e) = prompt_manager::run(prompt_manager_state).await {
            tracing::error!("Prompt manager error: {}", e);
        }
    });

    let app = Router::new()
        .route("/health", get(|| async { "OK" }))
        .route("/prompts", post(api::submit_prompt))
        .route("/prompts", get(api::get_prompt_state))
        .route("/prompts", put(api::add_random_prompt))
        .route("/ws", get(ws::websocket_handler))
        .layer(CorsLayer::permissive())
        .with_state(app_state.clone());

    let addr = SocketAddr::from(([0, 0, 0, 0], app_state.config.server_port));
    info!("Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
