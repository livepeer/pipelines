export interface Prompt {
  id: string;
  content: string;
  submitted_at: Date;
  stream_key: string;
}

export interface CurrentPrompt {
  prompt: Prompt;
  started_at: Date;
}

export interface RecentPromptItem {
  id: string;
  text: string;
  timestamp: number;
}

export interface PromptQueueEntry {
  prompt: Prompt;
  added_at: Date;
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

export interface PromptQuery {
  streamKey: string;
}

export interface WsQuery {
  streamKey?: string;
}

export type WsMessage =
  | {
      type: "CurrentPrompt";
      payload: {
        prompt: CurrentPrompt | null;
        stream_key: string;
      };
    }
  | {
      type: "RecentPromptsUpdate";
      payload: {
        recent_prompts: RecentPromptItem[];
        stream_key: string;
      };
    }
  | {
      type: "initial";
      payload: {
        currentPrompt: CurrentPrompt | null;
        recentPrompts: RecentPromptItem[];
        streamKey: string;
      };
    };

export interface Config {
  redis_url: string;
  port: number;
  prompt_min_duration_secs: number;
  stream_keys: string[];
  gateway_hosts: string[];
  stream_api_user: string;
  stream_api_password: string;
}
