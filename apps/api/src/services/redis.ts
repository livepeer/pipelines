import { createClient, RedisClientType } from "redis";
import { Prompt, CurrentPrompt, PromptQueueEntry } from "../types/models";
import { v4 as uuidv4 } from "uuid";

const PROMPT_QUEUE_KEY_PREFIX = "prompt_queue:";
const CURRENT_PROMPT_KEY_PREFIX = "current_prompt:";
const RECENT_PROMPTS_KEY_PREFIX = "recent_prompts:";
const MAX_QUEUE_SIZE = 100;
const MAX_RECENT_PROMPTS = 50;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100;

export class RedisClient {
  private client: RedisClientType;
  private isConnected = false;

  constructor(redisUrl: string) {
    this.client = createClient({ url: redisUrl });

    this.client.on("error", err => {
      console.error("Redis Client Error:", err);
      this.isConnected = false;
    });

    this.client.on("connect", () => {
      console.log("Connected to Redis");
      this.isConnected = true;
    });

    this.client.on("disconnect", () => {
      console.log("Disconnected from Redis");
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await this.ensureConnection();
        return await operation();
      } catch (error) {
        if (attempt < MAX_RETRIES && this.isConnectionError(error)) {
          console.warn(
            `Redis operation failed (attempt ${attempt}), retrying:`,
            error,
          );
          this.isConnected = false;
          await this.sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
        throw error;
      }
    }
    throw new Error(`Operation failed after ${MAX_RETRIES} attempts`);
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  private isConnectionError(error: any): boolean {
    const errorStr = error?.message?.toLowerCase() || "";
    return (
      errorStr.includes("broken pipe") ||
      errorStr.includes("connection") ||
      errorStr.includes("io error") ||
      errorStr.includes("timeout")
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async addPromptToQueue(prompt: Prompt): Promise<number> {
    const queueKey = `${PROMPT_QUEUE_KEY_PREFIX}${prompt.stream_key}`;
    const recentKey = `${RECENT_PROMPTS_KEY_PREFIX}${prompt.stream_key}`;

    const entry: PromptQueueEntry = {
      prompt,
      added_at: new Date(),
    };

    const entryJson = JSON.stringify(entry);

    return this.executeWithRetry(async () => {
      const multi = this.client.multi();

      multi.rPush(queueKey, entryJson);
      multi.lTrim(queueKey, -MAX_QUEUE_SIZE, -1);
      multi.lPush(recentKey, entryJson);
      multi.lTrim(recentKey, 0, MAX_RECENT_PROMPTS - 1);
      multi.lLen(queueKey);

      const results = await multi.exec();
      return results[4] as number; // queue length is the last result
    });
  }

  async getNextPrompt(streamKey: string): Promise<PromptQueueEntry | null> {
    const queueKey = `${PROMPT_QUEUE_KEY_PREFIX}${streamKey}`;

    return this.executeWithRetry(async () => {
      const entryJson = await this.client.lPop(queueKey);

      if (!entryJson) {
        return null;
      }

      const entry = JSON.parse(entryJson) as PromptQueueEntry;
      entry.prompt.submitted_at = new Date(entry.prompt.submitted_at);
      entry.added_at = new Date(entry.added_at);

      return entry;
    });
  }

  async getQueueLength(streamKey: string): Promise<number> {
    const queueKey = `${PROMPT_QUEUE_KEY_PREFIX}${streamKey}`;

    return this.executeWithRetry(async () => {
      return await this.client.lLen(queueKey);
    });
  }

  async setCurrentPrompt(prompt: Prompt): Promise<void> {
    const currentKey = `${CURRENT_PROMPT_KEY_PREFIX}${prompt.stream_key}`;

    const currentPrompt: CurrentPrompt = {
      prompt,
      started_at: new Date(),
    };

    return this.executeWithRetry(async () => {
      await this.client.set(currentKey, JSON.stringify(currentPrompt));
    });
  }

  async getCurrentPrompt(streamKey: string): Promise<CurrentPrompt | null> {
    const currentKey = `${CURRENT_PROMPT_KEY_PREFIX}${streamKey}`;

    return this.executeWithRetry(async () => {
      const currentJson = await this.client.get(currentKey);

      if (!currentJson) {
        return null;
      }

      const current = JSON.parse(currentJson) as CurrentPrompt;
      current.prompt.submitted_at = new Date(current.prompt.submitted_at);
      current.started_at = new Date(current.started_at);

      return current;
    });
  }

  async getRecentPrompts(
    streamKey: string,
    limit: number,
  ): Promise<PromptQueueEntry[]> {
    const recentKey = `${RECENT_PROMPTS_KEY_PREFIX}${streamKey}`;

    return this.executeWithRetry(async () => {
      const entriesJson = await this.client.lRange(recentKey, 0, limit - 1);

      return entriesJson.map(json => {
        const entry = JSON.parse(json) as PromptQueueEntry;
        entry.prompt.submitted_at = new Date(entry.prompt.submitted_at);
        entry.added_at = new Date(entry.added_at);
        return entry;
      });
    });
  }

  async clearCurrentPrompt(streamKey: string): Promise<void> {
    const currentKey = `${CURRENT_PROMPT_KEY_PREFIX}${streamKey}`;

    return this.executeWithRetry(async () => {
      await this.client.del(currentKey);
    });
  }
}

export function createPrompt(content: string, streamKey: string): Prompt {
  return {
    id: uuidv4(),
    content,
    submitted_at: new Date(),
    stream_key: streamKey,
  };
}
