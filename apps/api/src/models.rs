use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: String,
    pub username: String,
    pub content: String,
    pub timestamp: DateTime<Utc>,
}

impl ChatMessage {
    pub fn new(username: String, content: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            username,
            content,
            timestamp: Utc::now(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Prompt {
    pub id: String,
    pub content: String,
    pub submitted_by: String,
    pub submitted_at: DateTime<Utc>,
}

impl Prompt {
    pub fn new(content: String, submitted_by: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            content,
            submitted_by,
            submitted_at: Utc::now(),
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
}

// WebSocket message types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum WsMessage {
    Chat(ChatMessage),
    CurrentPrompt(Option<CurrentPrompt>),
    InitialData(InitialData),
}

#[derive(Debug, Deserialize)]
pub struct SubmitPromptRequest {
    pub content: String,
    pub username: String,
}

#[derive(Debug, Serialize)]
pub struct SubmitPromptResponse {
    pub id: String,
    pub message: String,
}
