use crate::models::{CurrentPrompt, Prompt, PromptQueueEntry};
use anyhow::{Context, Result};
use chrono::Utc;
use redis::aio::MultiplexedConnection;
use redis::{AsyncCommands, Client};
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{error, info, warn};

const PROMPT_QUEUE_KEY_PREFIX: &str = "prompt_queue:";
const CURRENT_PROMPT_KEY_PREFIX: &str = "current_prompt:";
const RECENT_PROMPTS_KEY_PREFIX: &str = "recent_prompts:";
const MAX_QUEUE_SIZE: isize = 100;
const MAX_RECENT_PROMPTS: isize = 50;
const MAX_RETRIES: u32 = 3;
const RETRY_DELAY_MS: u64 = 100;

#[derive(Clone)]
pub struct RedisClient {
    client: Client,
    conn: Arc<Mutex<Option<MultiplexedConnection>>>,
}

impl RedisClient {
    pub async fn new(redis_url: &str) -> Result<Self> {
        let client = Client::open(redis_url).context("Failed to create Redis client")?;

        let conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to connect to Redis")?;

        info!("Connected to Redis");

        Ok(Self {
            client,
            conn: Arc::new(Mutex::new(Some(conn))),
        })
    }

    async fn get_connection(&self) -> Result<MultiplexedConnection> {
        let mut conn_guard = self.conn.lock().await;

        if let Some(conn) = conn_guard.as_ref() {
            let mut test_conn = conn.clone();
            if test_conn.ping::<String>().await.is_ok() {
                return Ok(conn.clone());
            } else {
                warn!("Redis connection is broken, attempting to reconnect...");
                *conn_guard = None;
            }
        }

        for attempt in 1..=MAX_RETRIES {
            match self.client.get_multiplexed_async_connection().await {
                Ok(new_conn) => {
                    info!("Successfully reconnected to Redis on attempt {}", attempt);
                    *conn_guard = Some(new_conn.clone());
                    return Ok(new_conn);
                }
                Err(e) => {
                    error!("Failed to reconnect to Redis (attempt {}): {}", attempt, e);
                    if attempt < MAX_RETRIES {
                        tokio::time::sleep(tokio::time::Duration::from_millis(
                            RETRY_DELAY_MS * attempt as u64,
                        ))
                        .await;
                    }
                }
            }
        }

        Err(anyhow::anyhow!(
            "Failed to establish Redis connection after {} attempts",
            MAX_RETRIES
        ))
    }

    async fn execute_with_retry<F, Fut, T>(&self, operation: F) -> Result<T>
    where
        F: Fn(MultiplexedConnection) -> Fut,
        Fut: std::future::Future<Output = Result<T>>,
    {
        for attempt in 1..=MAX_RETRIES {
            match self.get_connection().await {
                Ok(conn) => {
                    match operation(conn).await {
                        Ok(result) => return Ok(result),
                        Err(e) => {
                            if attempt < MAX_RETRIES && Self::is_connection_error(&e) {
                                warn!(
                                    "Redis operation failed (attempt {}), retrying: {}",
                                    attempt, e
                                );
                                // Mark connection as broken
                                *self.conn.lock().await = None;
                                tokio::time::sleep(tokio::time::Duration::from_millis(
                                    RETRY_DELAY_MS,
                                ))
                                .await;
                                continue;
                            } else {
                                return Err(e);
                            }
                        }
                    }
                }
                Err(e) => {
                    if attempt < MAX_RETRIES {
                        warn!(
                            "Failed to get Redis connection (attempt {}), retrying: {}",
                            attempt, e
                        );
                        tokio::time::sleep(tokio::time::Duration::from_millis(RETRY_DELAY_MS))
                            .await;
                        continue;
                    } else {
                        return Err(e);
                    }
                }
            }
        }

        Err(anyhow::anyhow!(
            "Operation failed after {} attempts",
            MAX_RETRIES
        ))
    }

    fn is_connection_error(error: &anyhow::Error) -> bool {
        let error_str = error.to_string().to_lowercase();
        error_str.contains("broken pipe")
            || error_str.contains("connection")
            || error_str.contains("io error")
            || error_str.contains("timeout")
    }

    pub async fn add_prompt_to_queue(&self, prompt: Prompt) -> Result<usize> {
        let queue_key = format!("{}{}", PROMPT_QUEUE_KEY_PREFIX, prompt.stream_key);
        let recent_key = format!("{}{}", RECENT_PROMPTS_KEY_PREFIX, prompt.stream_key);

        let entry = PromptQueueEntry {
            prompt: prompt.clone(),
            added_at: Utc::now(),
        };

        let entry_json = serde_json::to_string(&entry)?;

        self.execute_with_retry(move |mut conn| {
            let queue_key = queue_key.clone();
            let recent_key = recent_key.clone();
            let entry_json = entry_json.clone();

            async move {
                let _: () = conn
                    .rpush(&queue_key, &entry_json)
                    .await
                    .context("Failed to add prompt to queue")?;
                let _: () = conn
                    .ltrim(&queue_key, -MAX_QUEUE_SIZE, -1)
                    .await
                    .context("Failed to trim queue")?;

                let _: () = conn
                    .lpush(&recent_key, &entry_json)
                    .await
                    .context("Failed to add to recent prompts")?;
                let _: () = conn
                    .ltrim(&recent_key, 0, MAX_RECENT_PROMPTS - 1)
                    .await
                    .context("Failed to trim recent prompts")?;

                let queue_length: usize = conn
                    .llen(&queue_key)
                    .await
                    .context("Failed to get queue length")?;
                Ok(queue_length)
            }
        })
        .await
    }

    pub async fn get_next_prompt(&self, stream_key: &str) -> Result<Option<PromptQueueEntry>> {
        let queue_key = format!("{}{}", PROMPT_QUEUE_KEY_PREFIX, stream_key);

        self.execute_with_retry(move |mut conn| {
            let queue_key = queue_key.clone();

            async move {
                let entry_json: Option<String> = conn
                    .lpop(&queue_key, None)
                    .await
                    .context("Failed to pop from queue")?;

                match entry_json {
                    Some(json) => Ok(Some(
                        serde_json::from_str(&json)
                            .context("Failed to deserialize prompt entry")?,
                    )),
                    None => Ok(None),
                }
            }
        })
        .await
    }

    pub async fn get_queue_length(&self, stream_key: &str) -> Result<usize> {
        let queue_key = format!("{}{}", PROMPT_QUEUE_KEY_PREFIX, stream_key);

        self.execute_with_retry(move |mut conn| {
            let queue_key = queue_key.clone();

            async move {
                let length: usize = conn
                    .llen(&queue_key)
                    .await
                    .context("Failed to get queue length")?;
                Ok(length)
            }
        })
        .await
    }

    pub async fn set_current_prompt(&self, prompt: Prompt) -> Result<()> {
        let current_key = format!("{}{}", CURRENT_PROMPT_KEY_PREFIX, prompt.stream_key);
        let current = CurrentPrompt {
            prompt: prompt.clone(),
            started_at: Utc::now(),
        };
        let current_json = serde_json::to_string(&current)?;

        self.execute_with_retry(move |mut conn| {
            let current_key = current_key.clone();
            let current_json = current_json.clone();

            async move {
                let _: () = conn
                    .set(&current_key, current_json)
                    .await
                    .context("Failed to set current prompt")?;
                Ok(())
            }
        })
        .await
    }

    pub async fn get_current_prompt(&self, stream_key: &str) -> Result<Option<CurrentPrompt>> {
        let current_key = format!("{}{}", CURRENT_PROMPT_KEY_PREFIX, stream_key);

        self.execute_with_retry(move |mut conn| {
            let current_key = current_key.clone();

            async move {
                let current_json: Option<String> = conn
                    .get(&current_key)
                    .await
                    .context("Failed to get current prompt")?;

                match current_json {
                    Some(json) => Ok(Some(
                        serde_json::from_str(&json)
                            .context("Failed to deserialize current prompt")?,
                    )),
                    None => Ok(None),
                }
            }
        })
        .await
    }

    pub async fn get_recent_prompts(
        &self,
        stream_key: &str,
        limit: usize,
    ) -> Result<Vec<PromptQueueEntry>> {
        let recent_key = format!("{}{}", RECENT_PROMPTS_KEY_PREFIX, stream_key);

        self.execute_with_retry(move |mut conn| {
            let recent_key = recent_key.clone();

            async move {
                let entries_json: Vec<String> = conn
                    .lrange(&recent_key, 0, limit as isize - 1)
                    .await
                    .context("Failed to get recent prompts")?;

                let mut entries = Vec::new();
                for json in entries_json {
                    if let Ok(entry) = serde_json::from_str::<PromptQueueEntry>(&json) {
                        entries.push(entry);
                    }
                }

                Ok(entries)
            }
        })
        .await
    }
}
