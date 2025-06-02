use anyhow::{Context, Result};
use std::env;

pub struct Config {
    pub redis_url: String,
    pub server_port: u16,
    pub max_chat_messages: usize,
    pub prompt_min_duration_secs: u64,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        dotenvy::dotenv().ok();

        let redis_url = env::var("REDIS_URL")
            .unwrap_or_else(|_| "redis://localhost:6379".to_string());
        
        let server_port = env::var("SERVER_PORT")
            .unwrap_or_else(|_| "3000".to_string())
            .parse::<u16>()
            .context("Failed to parse SERVER_PORT")?;
        
        let max_chat_messages = env::var("MAX_CHAT_MESSAGES")
            .unwrap_or_else(|_| "100".to_string())
            .parse::<usize>()
            .context("Failed to parse MAX_CHAT_MESSAGES")?;
        
        let prompt_min_duration_secs = env::var("PROMPT_MIN_DURATION_SECS")
            .unwrap_or_else(|_| "5".to_string())
            .parse::<u64>()
            .context("Failed to parse PROMPT_MIN_DURATION_SECS")?;

        Ok(Config {
            redis_url,
            server_port,
            max_chat_messages,
            prompt_min_duration_secs,
        })
    }
} 