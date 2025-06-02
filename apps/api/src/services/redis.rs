use crate::models::{ChatMessage, CurrentPrompt, Prompt, PromptQueueEntry};
use anyhow::{Context, Result};
use chrono::Utc;
use redis::aio::MultiplexedConnection;
use redis::{AsyncCommands, Client};
use tracing::info;

const PROMPT_QUEUE_KEY_PREFIX: &str = "prompt_queue:";
const CURRENT_PROMPT_KEY_PREFIX: &str = "current_prompt:";
const CHAT_MESSAGES_KEY_PREFIX: &str = "chat_messages:";
const MAX_QUEUE_SIZE: isize = 100;

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

    pub async fn add_prompt_to_queue(&self, prompt: Prompt) -> Result<usize> {
        let mut conn = self.conn.clone();
        let queue_key = format!("{}{}", PROMPT_QUEUE_KEY_PREFIX, prompt.stream_key);

        let entry = PromptQueueEntry {
            prompt: prompt.clone(),
            added_at: Utc::now(),
        };

        let entry_json = serde_json::to_string(&entry)?;
        let _: () = conn.rpush(&queue_key, entry_json).await?;

        let _: () = conn.ltrim(&queue_key, -MAX_QUEUE_SIZE, -1).await?;

        let queue_length: usize = conn.llen(&queue_key).await?;
        Ok(queue_length)
    }

    pub async fn get_next_prompt(&self, stream_key: &str) -> Result<Option<PromptQueueEntry>> {
        let mut conn = self.conn.clone();
        let queue_key = format!("{}{}", PROMPT_QUEUE_KEY_PREFIX, stream_key);
        let entry_json: Option<String> = conn.lpop(&queue_key, None).await?;

        match entry_json {
            Some(json) => Ok(Some(serde_json::from_str(&json)?)),
            None => Ok(None),
        }
    }

    pub async fn get_queue_length(&self, stream_key: &str) -> Result<usize> {
        let mut conn = self.conn.clone();
        let queue_key = format!("{}{}", PROMPT_QUEUE_KEY_PREFIX, stream_key);
        let length: usize = conn.llen(&queue_key).await?;
        Ok(length)
    }

    pub async fn set_current_prompt(&self, prompt: Prompt) -> Result<()> {
        let mut conn = self.conn.clone();
        let current_key = format!("{}{}", CURRENT_PROMPT_KEY_PREFIX, prompt.stream_key);
        let current = CurrentPrompt {
            prompt: prompt.clone(),
            started_at: Utc::now(),
        };
        let current_json = serde_json::to_string(&current)?;
        let _: () = conn.set(&current_key, current_json).await?;
        Ok(())
    }

    pub async fn get_current_prompt(&self, stream_key: &str) -> Result<Option<CurrentPrompt>> {
        let mut conn = self.conn.clone();
        let current_key = format!("{}{}", CURRENT_PROMPT_KEY_PREFIX, stream_key);
        let current_json: Option<String> = conn.get(&current_key).await?;

        match current_json {
            Some(json) => Ok(Some(serde_json::from_str(&json)?)),
            None => Ok(None),
        }
    }

    pub async fn clear_current_prompt(&self, stream_key: &str) -> Result<()> {
        let mut conn = self.conn.clone();
        let current_key = format!("{}{}", CURRENT_PROMPT_KEY_PREFIX, stream_key);
        let _: () = conn.del(&current_key).await?;
        Ok(())
    }

    pub async fn add_chat_message(&self, message: &ChatMessage, stream_key: &str) -> Result<()> {
        let mut conn = self.conn.clone();
        let messages_key = format!("{}{}", CHAT_MESSAGES_KEY_PREFIX, stream_key);
        let message_json = serde_json::to_string(message)?;

        let _: () = conn.lpush(&messages_key, message_json).await?;

        let _: () = conn.ltrim(&messages_key, 0, 99).await?;

        Ok(())
    }

    pub async fn get_recent_messages(
        &self,
        stream_key: &str,
        count: usize,
    ) -> Result<Vec<ChatMessage>> {
        let mut conn = self.conn.clone();
        let messages_key = format!("{}{}", CHAT_MESSAGES_KEY_PREFIX, stream_key);
        let messages_json: Vec<String> = conn.lrange(&messages_key, 0, count as isize - 1).await?;

        let mut messages = Vec::new();
        for json in messages_json.iter().rev() {
            if let Ok(message) = serde_json::from_str::<ChatMessage>(json) {
                messages.push(message);
            }
        }

        Ok(messages)
    }

    pub async fn get_prompt_queue(
        &self,
        stream_key: &str,
        limit: usize,
    ) -> Result<Vec<PromptQueueEntry>> {
        let mut conn = self.conn.clone();
        let queue_key = format!("{}{}", PROMPT_QUEUE_KEY_PREFIX, stream_key);
        let entries_json: Vec<String> = conn.lrange(&queue_key, 0, limit as isize - 1).await?;

        let mut entries = Vec::new();
        for json in entries_json {
            if let Ok(entry) = serde_json::from_str::<PromptQueueEntry>(&json) {
                entries.push(entry);
            }
        }

        Ok(entries)
    }
}
