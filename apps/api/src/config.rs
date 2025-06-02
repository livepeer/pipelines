use anyhow::{Context, Result};
use std::env;

pub struct Config {
    pub redis_url: String,
    pub server_port: u16,
    pub prompt_min_duration_secs: u64,
    pub stream_keys: Vec<String>,
    pub gateway_hosts: Vec<String>,
    pub stream_api_user: String,
    pub stream_api_password: String,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        dotenvy::dotenv().ok();

        let redis_url =
            env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string());

        let server_port = env::var("SERVER_PORT")
            .unwrap_or_else(|_| "8080".to_string())
            .parse::<u16>()
            .context("Failed to parse SERVER_PORT")?;

        let prompt_min_duration_secs = env::var("PROMPT_MIN_DURATION_SECS")
            .unwrap_or_else(|_| "10".to_string())
            .parse::<u64>()
            .context("Failed to parse PROMPT_MIN_DURATION_SECS")?;

        let stream_keys: Vec<String> = env::var("NEXT_PUBLIC_MULTIPLAYER_STREAM_KEY")
            .unwrap_or_else(|_| "default-stream".to_string())
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();

        let gateway_hosts: Vec<String> = env::var("GATEWAY_HOST")
            .context("GATEWAY_HOST environment variable is required")?
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();

        if gateway_hosts.len() != stream_keys.len() {
            return Err(anyhow::anyhow!(
                "Number of gateway hosts ({}) must match number of stream keys ({})",
                gateway_hosts.len(),
                stream_keys.len()
            ));
        }

        let stream_api_user = env::var("STREAM_STATUS_ENDPOINT_USER")
            .context("STREAM_STATUS_ENDPOINT_USER environment variable is required")?;

        let stream_api_password = env::var("STREAM_STATUS_ENDPOINT_PASSWORD")
            .context("STREAM_STATUS_ENDPOINT_PASSWORD environment variable is required")?;

        Ok(Config {
            redis_url,
            server_port,
            prompt_min_duration_secs,
            stream_keys,
            gateway_hosts,
            stream_api_user,
            stream_api_password,
        })
    }
}
