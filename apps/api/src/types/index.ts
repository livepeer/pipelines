export interface Prompt {
  id: string;
  content: string;
  submitted_at: string; // ISO string
  stream_key: string;
}

export interface CurrentPrompt {
  prompt: Prompt;
  started_at: string; // ISO string
}

export interface RecentPromptItem {
  id: string;
  text: string;
  timestamp: number;
}

export interface SubmitPromptRequest {
  text: string;
  streamKey: string;
}

export interface SubmitPromptResponse {
  id: string;
  message: string;
  queue_position: number;
}

export interface PromptQueueEntry {
  prompt: Prompt;
  added_at: string; // ISO string
}

export type WsMessage =
  | {
      type: "CurrentPrompt";
      prompt: CurrentPrompt | null;
      stream_key: string;
    }
  | {
      type: "RecentPromptsUpdate";
      recent_prompts: RecentPromptItem[];
      stream_key: string;
    };

export interface Config {
  redis_url: string;
  server_port: number;
  prompt_min_duration_secs: number;
  stream_keys: string[];
  gateway_hosts: string[];
  stream_api_user: string;
  stream_api_password: string;
}

export interface WebSocketClient {
  id: string;
  connection: any;
  streamKey: string;
}
