use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: String,
    pub username: String,
    pub content: String,
    pub timestamp: DateTime<Utc>,
    pub session_id: String,
    pub avatar_seed: String,
}

impl ChatMessage {
    pub fn new(username: String, content: String, session_id: String, avatar_seed: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            username,
            content,
            timestamp: Utc::now(),
            session_id,
            avatar_seed,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Prompt {
    pub id: String,
    pub content: String,
    pub submitted_by: String,
    pub submitted_at: DateTime<Utc>,
    pub session_id: String,
    pub avatar_seed: String,
    pub stream_key: String,
}

impl Prompt {
    pub fn new(
        content: String,
        submitted_by: String,
        session_id: String,
        avatar_seed: String,
        stream_key: String,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            content,
            submitted_by,
            submitted_at: Utc::now(),
            session_id,
            avatar_seed,
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
pub struct InitialData {
    pub current_prompt: Option<CurrentPrompt>,
    pub recent_messages: Vec<ChatMessage>,
    pub stream_key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum WsMessage {
    Chat(ChatMessage),
    CurrentPrompt {
        prompt: Option<CurrentPrompt>,
        stream_key: String,
    },
    InitialData(InitialData),
    StateUpdate {
        #[serde(rename = "promptState")]
        prompt_state: serde_json::Value,
        stream_key: String,
    },
    Error {
        message: String,
    },
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubmitPromptRequest {
    pub text: String,
    pub seed: String,
    pub is_user: bool,
    pub session_id: String,
    pub stream_key: String,
}

#[derive(Debug, Serialize)]
pub struct SubmitPromptResponse {
    pub id: String,
    pub message: String,
    pub was_censored: bool,
}

#[derive(Debug, Clone)]
pub struct StreamInfo {
    pub stream_key: String,
    pub gateway_host: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptQueueEntry {
    pub prompt: Prompt,
    pub added_at: DateTime<Utc>,
}
