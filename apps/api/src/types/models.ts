export interface Prompt {
  id: string;
  content: string;
  submitted_at: Date;
  stream_id: string;
  submit_url: string;
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
  streamId: string;
}

export interface SubmitPromptResponse {
  id: string;
  message: string;
  queue_position: number;
}

export interface WsQuery {
  streamId?: string;
}

export type WsMessage =
  | {
      type: "CurrentPrompt";
      payload: {
        prompt: CurrentPrompt | null;
        stream_id: string;
      };
    }
  | {
      type: "RecentPromptsUpdate";
      payload: {
        recent_prompts: RecentPromptItem[];
        stream_id: string;
      };
    }
  | {
      type: "initial";
      payload: {
        currentPrompt: CurrentPrompt | null;
        recentPrompts: RecentPromptItem[];
        streamId: string;
      };
    };

export interface Config {
  port: number;
  prompt_min_duration_secs: number;
  stream_api_user: string;
  stream_api_password: string;
}
