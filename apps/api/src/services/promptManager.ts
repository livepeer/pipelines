import { AppState } from "../appState";
import { WsMessage } from "../types";
import { StreamApi } from "./streamApi";

const COOLDOWN_DURATION_MS = 20000; // 20 seconds

interface FailureTracker {
  [streamKey: string]: number; // timestamp
}

export class PromptManager {
  private appState: AppState;
  private failureTracker: FailureTracker = {};
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;

  constructor(appState: AppState) {
    this.appState = appState;
  }

  public start(): void {
    if (this.isRunning) {
      console.warn("Prompt manager is already running");
      return;
    }

    console.log("Prompt manager started");
    this.isRunning = true;

    this.intervalId = setInterval(async () => {
      await this.processStreams();
    }, 1000); // Check every second
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    console.log("Prompt manager stopped");
  }

  private async processStreams(): Promise<void> {
    for (const streamKey of this.appState.config.stream_keys) {
      // Check cooldown for this stream
      const lastFailure = this.failureTracker[streamKey];
      if (lastFailure && Date.now() - lastFailure < COOLDOWN_DURATION_MS) {
        continue;
      }

      try {
        const updated = await this.checkAndUpdatePrompt(streamKey);
        if (updated) {
          console.log(`Prompt updated for stream: ${streamKey}`);
        }
        delete this.failureTracker[streamKey];
      } catch (error) {
        const errorStr = String(error).toLowerCase();
        if (
          errorStr.includes("broken pipe") ||
          errorStr.includes("connection") ||
          errorStr.includes("redis")
        ) {
          console.warn(
            `Redis connection issue for stream ${streamKey}:`,
            error,
          );
        } else {
          console.error(
            `Error in prompt manager for stream ${streamKey}:`,
            error,
          );
        }
        this.failureTracker[streamKey] = Date.now();
      }
    }
  }

  private async checkAndUpdatePrompt(streamKey: string): Promise<boolean> {
    try {
      const currentPrompt =
        await this.appState.redis.getCurrentPrompt(streamKey);

      const shouldUpdate =
        !currentPrompt ||
        Date.now() - new Date(currentPrompt.started_at).getTime() >=
          this.appState.config.prompt_min_duration_secs * 1000;

      if (!shouldUpdate) {
        return false;
      }

      const nextEntry = await this.appState.redis.getNextPrompt(streamKey);

      if (nextEntry) {
        const nextPrompt = nextEntry.prompt;

        await this.appState.redis.setCurrentPrompt(nextPrompt);

        await this.applyPromptToStream(nextPrompt.content, streamKey);

        const newCurrent =
          await this.appState.redis.getCurrentPrompt(streamKey);
        if (newCurrent) {
          const wsMessage: WsMessage = {
            type: "CurrentPrompt",
            prompt: newCurrent,
            stream_key: streamKey,
          };

          await this.appState.broadcastMessage(wsMessage);

          const queueLength =
            await this.appState.redis.getQueueLength(streamKey);
          console.log(`Stream ${streamKey} - Queue length: ${queueLength}`);
        }
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  private async applyPromptToStream(
    promptContent: string,
    streamKey: string,
  ): Promise<void> {
    const streamIndex = this.appState.config.stream_keys.indexOf(streamKey);
    if (streamIndex === -1) {
      throw new Error(`Stream key ${streamKey} not found in configuration`);
    }

    const gatewayHost = this.appState.config.gateway_hosts[streamIndex];
    if (!gatewayHost) {
      throw new Error(`No gateway host found for stream key: ${streamKey}`);
    }

    try {
      await StreamApi.applyPromptToStream(
        promptContent,
        streamKey,
        gatewayHost,
        this.appState.config.stream_api_user,
        this.appState.config.stream_api_password,
      );
    } catch (error) {
      console.error(`Failed to apply prompt to stream ${streamKey}:`, error);
      throw error;
    }
  }
}
