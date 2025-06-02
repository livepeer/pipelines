use crate::models::{ChatMessage, CurrentPrompt, Prompt};
use anyhow::{Context, Result};
use chrono::Utc;
use redis::aio::MultiplexedConnection;
use redis::{AsyncCommands, Client};
use tracing::info;

const PROMPT_QUEUE_KEY: &str = "prompt_queue";
const CURRENT_PROMPT_KEY: &str = "current_prompt";
const CHAT_MESSAGES_KEY: &str = "chat_messages";

#[derive(Clone)]
pub struct RedisClient {
    conn: MultiplexedConnection,
}

impl RedisClient {
    pub async fn new(redis_url: &str) -> Result<Self> {
        let client = Client::open(redis_url).context("Failed to create Redis client")?;

        let conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to connect to Redis")?;

        info!("Connected to Redis");

        Ok(Self { conn })
    }

    pub async fn add_prompt_to_queue(&self, prompt: Prompt) -> Result<()> {
        let mut conn = self.conn.clone();
        let prompt_json = serde_json::to_string(&prompt)?;
        let _: () = conn.rpush(PROMPT_QUEUE_KEY, prompt_json).await?;
        Ok(())
    }

    pub async fn get_next_prompt(&self) -> Result<Option<Prompt>> {
        let mut conn = self.conn.clone();
        let prompt_json: Option<String> = conn.lpop(PROMPT_QUEUE_KEY, None).await?;

        match prompt_json {
            Some(json) => Ok(Some(serde_json::from_str(&json)?)),
            None => Ok(None),
        }
    }

    pub async fn set_current_prompt(&self, prompt: Prompt) -> Result<()> {
        let mut conn = self.conn.clone();
        let current = CurrentPrompt {
            prompt,
            started_at: Utc::now(),
        };
        let current_json = serde_json::to_string(&current)?;
        let _: () = conn.set(CURRENT_PROMPT_KEY, current_json).await?;
        Ok(())
    }

    pub async fn get_current_prompt(&self) -> Result<Option<CurrentPrompt>> {
        let mut conn = self.conn.clone();
        let current_json: Option<String> = conn.get(CURRENT_PROMPT_KEY).await?;

        match current_json {
            Some(json) => Ok(Some(serde_json::from_str(&json)?)),
            None => Ok(None),
        }
    }

    pub async fn clear_current_prompt(&self) -> Result<()> {
        let mut conn = self.conn.clone();
        let _: () = conn.del(CURRENT_PROMPT_KEY).await?;
        Ok(())
    }

    pub async fn add_chat_message(&self, message: &ChatMessage) -> Result<()> {
        let mut conn = self.conn.clone();
        let message_json = serde_json::to_string(message)?;

        let _: () = conn.lpush(CHAT_MESSAGES_KEY, message_json).await?;

        let _: () = conn.ltrim(CHAT_MESSAGES_KEY, 0, 99).await?;

        Ok(())
    }

    pub async fn get_recent_messages(&self, count: usize) -> Result<Vec<ChatMessage>> {
        let mut conn = self.conn.clone();
        let messages_json: Vec<String> = conn
            .lrange(CHAT_MESSAGES_KEY, 0, count as isize - 1)
            .await?;

        let mut messages = Vec::new();
        for json in messages_json.iter().rev() {
            // Reverse to get chronological order
            if let Ok(message) = serde_json::from_str::<ChatMessage>(json) {
                messages.push(message);
            }
        }

        Ok(messages)
    }
}
