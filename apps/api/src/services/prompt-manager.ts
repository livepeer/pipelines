import { FastifyInstance } from "fastify";
import { WsMessage } from "../types/models";
import { applyPromptToStream } from "./stream-api";

interface FailureTracker {
  [streamKey: string]: Date;
}

const COOLDOWN_DURATION_MS = 20 * 1000; // 20 seconds

export class PromptManager {
  private fastify: FastifyInstance;
  private isRunning = false;
  private failureTracker: FailureTracker = {};

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.fastify.log.info("Prompt manager started");

    // Run the main loop
    this.runLoop().catch(error => {
      this.fastify.log.error("Prompt manager error:", error);
    });
  }

  stop(): void {
    this.isRunning = false;
    this.fastify.log.info("Prompt manager stopped");
  }

  private async runLoop(): Promise<void> {
    while (this.isRunning) {
      await this.sleep(1000); // Check every second

      for (const streamKey of this.fastify.config.stream_keys) {
        // Check cooldown
        const lastFailure = this.failureTracker[streamKey];
        if (
          lastFailure &&
          Date.now() - lastFailure.getTime() < COOLDOWN_DURATION_MS
        ) {
          continue;
        }

        try {
          const updated = await this.checkAndUpdatePrompt(streamKey);
          if (updated) {
            this.fastify.log.info(`Prompt updated for stream: ${streamKey}`);
          }
          // Remove from failure tracker on success
          delete this.failureTracker[streamKey];
        } catch (error) {
          const errorStr = error?.toString().toLowerCase() || "";
          if (
            errorStr.includes("broken pipe") ||
            errorStr.includes("connection") ||
            errorStr.includes("redis")
          ) {
            this.fastify.log.warn(
              `Redis connection issue for stream ${streamKey}:`,
              error,
            );
          } else {
            this.fastify.log.error(
              `Error in prompt manager for stream ${streamKey}:`,
              error,
            );
          }
          this.failureTracker[streamKey] = new Date();
        }
      }
    }
  }

  private async checkAndUpdatePrompt(streamKey: string): Promise<boolean> {
    const currentPrompt = await this.fastify.redis.getCurrentPrompt(streamKey);

    const shouldUpdate = (() => {
      if (!currentPrompt) {
        return true;
      }

      const elapsed = Date.now() - currentPrompt.started_at.getTime();
      const minDurationMs = this.fastify.config.prompt_min_duration_secs * 1000;
      return elapsed >= minDurationMs;
    })();

    if (!shouldUpdate) {
      return false;
    }

    const nextEntry = await this.fastify.redis.getNextPrompt(streamKey);
    if (!nextEntry) {
      // No new prompts in queue, keep current prompt active
      return false;
    }

    const nextPrompt = nextEntry.prompt;

    // Set as current prompt
    await this.fastify.redis.setCurrentPrompt(nextPrompt);

    // Find the corresponding gateway host
    const streamIndex = this.fastify.config.stream_keys.indexOf(streamKey);
    const gatewayHost = this.fastify.config.gateway_hosts[streamIndex];

    if (!gatewayHost) {
      throw new Error(`No gateway host found for stream key: ${streamKey}`);
    }

    // Apply prompt to stream
    try {
      console.log(
        this.fastify.config.stream_api_password,
        this.fastify.config.stream_api_user,
      );
      await applyPromptToStream(
        nextPrompt.content,
        streamKey,
        gatewayHost,
        this.fastify.config.stream_api_user,
        this.fastify.config.stream_api_password,
      );
    } catch (error) {
      this.fastify.log.error(
        `Failed to apply prompt to stream ${streamKey}:`,
        error,
      );
    }

    // Broadcast the current prompt update
    const newCurrent = await this.fastify.redis.getCurrentPrompt(streamKey);
    if (newCurrent) {
      const wsMessage: WsMessage = {
        type: "CurrentPrompt",
        payload: {
          prompt: newCurrent,
          stream_key: streamKey,
        },
      };

      this.fastify.broadcastMessage(wsMessage);

      const queueLength = await this.fastify.redis.getQueueLength(streamKey);
      this.fastify.log.info(
        `Stream ${streamKey} - Queue length: ${queueLength}`,
      );
    }

    return true;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
