import { FastifyInstance } from "fastify";
import { Queue, Worker, Job } from "bullmq";
import { WsMessage } from "../types/models";
import { applyPromptToStream } from "./stream-api";

interface PromptCheckJobData {
  streamId: string;
}

export class PromptManager {
  private fastify: FastifyInstance;
  private promptQueue: Queue<PromptCheckJobData>;
  private worker: Worker<PromptCheckJobData>;
  private isRunning = false;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;

    const connection = {
      host: "localhost",
      port: 6379,
    };

    this.promptQueue = new Queue<PromptCheckJobData>("prompt-check", {
      connection,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    });

    this.worker = new Worker<PromptCheckJobData>(
      "prompt-check",
      async (job: Job<PromptCheckJobData>) => {
        return this.processPromptCheck(job.data.streamId);
      },
      {
        connection,
        concurrency: 5,
      },
    );
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.fastify.log.info("Prompt manager started with BullMQ");

    this.worker.on(
      "failed",
      (job: Job<PromptCheckJobData> | undefined, error: Error) => {
        this.fastify.log.error(
          `Prompt check job failed for stream ${job?.data?.streamId}:`,
          error,
        );
      },
    );

    this.worker.on("completed", (job: Job<PromptCheckJobData>) => {
      this.fastify.log.debug(
        `Prompt check completed for stream ${job.data.streamId}`,
      );
    });
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.fastify.log.info("Stopping prompt manager...");

    await this.worker.close();
    await this.promptQueue.close();
    this.fastify.log.info("Prompt manager stopped");
  }

  async schedulePromptCheck(
    streamId: string,
    delay: number = 0,
  ): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.promptQueue.add(
        `check-${streamId}`,
        { streamId },
        {
          delay,
          jobId: `check-${streamId}-${Date.now()}`,
        },
      );
    } catch (error) {
      this.fastify.log.error(
        `Failed to schedule prompt check for stream ${streamId}:`,
        error,
      );
    }
  }

  private async processPromptCheck(streamId: string): Promise<boolean> {
    try {
      const updated = await this.checkAndUpdatePrompt(streamId);

      if (updated) {
        this.fastify.log.info(`Prompt updated for stream: ${streamId}`);

        const nextDelay = this.fastify.config.prompt_min_duration_secs * 1000;
        await this.schedulePromptCheck(streamId, nextDelay);
      } else {
        await this.schedulePromptCheck(streamId, 5000);
      }

      return updated;
    } catch (error) {
      throw error;
    }
  }

  private async checkAndUpdatePrompt(streamId: string): Promise<boolean> {
    const currentPrompt = await this.fastify.redis.getCurrentPrompt(streamId);

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

    const nextEntry = await this.fastify.redis.getNextPrompt(streamId);

    if (!nextEntry) {
      return false;
    }

    const nextPrompt = nextEntry.prompt;

    await this.fastify.redis.setCurrentPrompt(nextPrompt);

    try {
      await applyPromptToStream(
        nextPrompt.content,
        nextPrompt.submit_url,
        this.fastify.config.stream_api_user,
        this.fastify.config.stream_api_password,
      );
    } catch (error) {
      this.fastify.log.error(
        `Failed to apply prompt to stream ${streamId}:`,
        error,
      );
    }

    const newCurrent = await this.fastify.redis.getCurrentPrompt(streamId);
    if (newCurrent) {
      const wsMessage: WsMessage = {
        type: "CurrentPrompt",
        payload: {
          prompt: newCurrent,
          stream_id: streamId,
        },
      };

      this.fastify.broadcastMessage(wsMessage);

      const queueLength = await this.fastify.redis.getQueueLength(streamId);
      this.fastify.log.info(
        `Stream ${streamId} - Queue length: ${queueLength}`,
      );
    }

    return true;
  }
}
