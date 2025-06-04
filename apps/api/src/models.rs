use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Prompt {
    pub id: String,
    pub content: String,
    pub submitted_at: DateTime<Utc>,
    pub stream_key: String,
}

impl Prompt {
    pub fn new(content: String, stream_key: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            content,
            submitted_at: Utc::now(),
            stream_key,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurrentPrompt {
    pub prompt: Prompt,
    pub started_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum WsMessage {
    CurrentPrompt {
        prompt: Option<CurrentPrompt>,
        stream_key: String,
    },
    RecentPromptsUpdate {
        recent_prompts: Vec<RecentPromptItem>,
        stream_key: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentPromptItem {
    pub id: String,
    pub text: String,
    pub timestamp: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubmitPromptRequest {
    pub text: String,
    pub stream_key: String,
}

#[derive(Debug, Serialize)]
pub struct SubmitPromptResponse {
    pub id: String,
    pub message: String,
    pub queue_position: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptQueueEntry {
    pub prompt: Prompt,
    pub added_at: DateTime<Utc>,
}
