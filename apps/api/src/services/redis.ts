import { createClient, RedisClientType } from "redis";
import { Prompt, CurrentPrompt, PromptQueueEntry } from "../types";
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
  private connected = false;

  constructor(redisUrl: string) {
    this.client = createClient({ url: redisUrl });
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on("error", err => {
      console.error("Redis Client Error:", err);
      this.connected = false;
    });

    this.client.on("connect", () => {
      console.log("Connected to Redis");
      this.connected = true;
    });

    this.client.on("disconnect", () => {
      console.log("Disconnected from Redis");
      this.connected = false;
    });
  }

  public async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
    }
  }

  public async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.disconnect();
    }
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (!this.connected) {
          await this.connect();
        }
        return await operation();
      } catch (error) {
        if (attempt < MAX_RETRIES && this.isConnectionError(error)) {
          console.warn(
            `Redis operation failed (attempt ${attempt}), retrying:`,
            error,
          );
          this.connected = false;
          await new Promise(resolve =>
            setTimeout(resolve, RETRY_DELAY_MS * attempt),
          );
          continue;
        }
        throw error;
      }
    }
    throw new Error(`Operation failed after ${MAX_RETRIES} attempts`);
  }

  private isConnectionError(error: any): boolean {
    if (!error) return false;
    const errorStr = error.toString().toLowerCase();
    return (
      errorStr.includes("broken pipe") ||
      errorStr.includes("connection") ||
      errorStr.includes("io error") ||
      errorStr.includes("timeout")
    );
  }

  public createPrompt(content: string, streamKey: string): Prompt {
    return {
      id: uuidv4(),
      content,
      submitted_at: new Date().toISOString(),
      stream_key: streamKey,
    };
  }

  public async addPromptToQueue(prompt: Prompt): Promise<number> {
    const queueKey = `${PROMPT_QUEUE_KEY_PREFIX}${prompt.stream_key}`;
    const recentKey = `${RECENT_PROMPTS_KEY_PREFIX}${prompt.stream_key}`;

    const entry: PromptQueueEntry = {
      prompt,
      added_at: new Date().toISOString(),
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
      return results[results.length - 1] as number; // Return queue length
    });
  }

  public async getNextPrompt(
    streamKey: string,
  ): Promise<PromptQueueEntry | null> {
    const queueKey = `${PROMPT_QUEUE_KEY_PREFIX}${streamKey}`;

    return this.executeWithRetry(async () => {
      const entryJson = await this.client.lPop(queueKey);

      if (!entryJson) {
        return null;
      }

      try {
        return JSON.parse(entryJson) as PromptQueueEntry;
      } catch (error) {
        throw new Error("Failed to deserialize prompt entry");
      }
    });
  }

  public async getQueueLength(streamKey: string): Promise<number> {
    const queueKey = `${PROMPT_QUEUE_KEY_PREFIX}${streamKey}`;

    return this.executeWithRetry(async () => {
      return await this.client.lLen(queueKey);
    });
  }

  public async setCurrentPrompt(prompt: Prompt): Promise<void> {
    const currentKey = `${CURRENT_PROMPT_KEY_PREFIX}${prompt.stream_key}`;
    const current: CurrentPrompt = {
      prompt,
      started_at: new Date().toISOString(),
    };

    const currentJson = JSON.stringify(current);

    return this.executeWithRetry(async () => {
      await this.client.set(currentKey, currentJson);
    });
  }

  public async getCurrentPrompt(
    streamKey: string,
  ): Promise<CurrentPrompt | null> {
    const currentKey = `${CURRENT_PROMPT_KEY_PREFIX}${streamKey}`;

    return this.executeWithRetry(async () => {
      const currentJson = await this.client.get(currentKey);

      if (!currentJson) {
        return null;
      }

      try {
        return JSON.parse(currentJson) as CurrentPrompt;
      } catch (error) {
        throw new Error("Failed to deserialize current prompt");
      }
    });
  }

  public async getRecentPrompts(
    streamKey: string,
    limit: number,
  ): Promise<PromptQueueEntry[]> {
    const recentKey = `${RECENT_PROMPTS_KEY_PREFIX}${streamKey}`;

    return this.executeWithRetry(async () => {
      const entriesJson = await this.client.lRange(recentKey, 0, limit - 1);

      const entries: PromptQueueEntry[] = [];
      for (const json of entriesJson) {
        try {
          const entry = JSON.parse(json) as PromptQueueEntry;
          entries.push(entry);
        } catch (error) {
          // Skip invalid entries
          console.warn("Failed to parse recent prompt entry:", error);
        }
      }

      return entries;
    });
  }
}
