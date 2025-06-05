import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  SubmitPromptRequest,
  SubmitPromptResponse,
  RecentPromptItem,
  WsMessage,
  PromptQueueEntry,
} from "../types";
import { AppState } from "../appState";

interface PromptQuery {
  streamKey: string;
}

const RANDOM_PROMPTS = [
  "A dragon breathing fire while playing the piano",
  "A robot chef cooking in a futuristic kitchen",
  "A pirate ship sailing through space",
  "A magical forest with glowing mushrooms",
  "A steampunk city in the clouds",
  "A cyberpunk cat wearing neon sunglasses",
  "A haunted library with floating books",
  "A mermaid palace under the ocean",
  "A time traveler's workshop filled with gadgets",
  "A wizard's tower surrounded by lightning",
  "A mystical castle floating in the clouds",
  "A bustling marketplace in an ancient city",
  "A peaceful zen garden with cherry blossoms",
];

export function registerApiRoutes(
  fastify: FastifyInstance,
  appState: AppState,
) {
  fastify.get(
    "/health",
    async (request: FastifyRequest, reply: FastifyReply) => {
      return { status: "OK" };
    },
  );

  fastify.post<{
    Body: SubmitPromptRequest;
  }>(
    "/prompts",
    async (
      request: FastifyRequest<{ Body: SubmitPromptRequest }>,
      reply: FastifyReply,
    ) => {
      const { text, streamKey } = request.body;

      if (!text || text.trim().length === 0) {
        reply.code(400);
        return { error: "Text is required" };
      }

      if (!appState.config.stream_keys.includes(streamKey)) {
        reply.code(400);
        return { error: "Invalid stream key" };
      }

      try {
        const prompt = appState.redis.createPrompt(text, streamKey);
        const queuePosition = await appState.redis.addPromptToQueue(prompt);

        console.log(
          `New prompt submitted: ${prompt.id} (queue position: ${queuePosition})`,
        );

        try {
          const recentEntries = await appState.redis.getRecentPrompts(
            streamKey,
            20,
          );
          const recentPrompts: RecentPromptItem[] = recentEntries.map(
            (entry: PromptQueueEntry) => ({
              id: entry.prompt.id,
              text: entry.prompt.content,
              timestamp: new Date(entry.added_at).getTime(),
            }),
          );

          const wsMessage: WsMessage = {
            type: "RecentPromptsUpdate",
            recent_prompts: recentPrompts,
            stream_key: streamKey,
          };

          await appState.broadcastMessage(wsMessage);
        } catch (error) {
          console.error("Failed to broadcast recent prompts update:", error);
        }

        const response: SubmitPromptResponse = {
          id: prompt.id,
          message: "Prompt submitted successfully",
          queue_position: queuePosition,
        };

        return response;
      } catch (error) {
        console.error("Failed to add prompt to queue:", error);
        reply.code(500);
        return { error: "Internal server error" };
      }
    },
  );

  fastify.get<{
    Querystring: PromptQuery;
  }>(
    "/prompts",
    async (
      request: FastifyRequest<{ Querystring: PromptQuery }>,
      reply: FastifyReply,
    ) => {
      const { streamKey } = request.query;

      if (!streamKey || !appState.config.stream_keys.includes(streamKey)) {
        reply.code(400);
        return { error: "Invalid or missing stream key" };
      }

      try {
        const currentPrompt = await appState.redis.getCurrentPrompt(streamKey);
        const recentEntries = await appState.redis.getRecentPrompts(
          streamKey,
          20,
        );

        const recentPrompts: RecentPromptItem[] = recentEntries.map(
          (entry: PromptQueueEntry) => ({
            id: entry.prompt.id,
            text: entry.prompt.content,
            timestamp: new Date(entry.added_at).getTime(),
          }),
        );

        return {
          currentPrompt,
          recentPrompts,
          streamKey,
        };
      } catch (error) {
        console.error("Failed to get prompt state:", error);
        reply.code(500);
        return { error: "Internal server error" };
      }
    },
  );

  fastify.put<{
    Querystring: PromptQuery;
  }>(
    "/prompts",
    async (
      request: FastifyRequest<{ Querystring: PromptQuery }>,
      reply: FastifyReply,
    ) => {
      const { streamKey } = request.query;

      if (!streamKey || !appState.config.stream_keys.includes(streamKey)) {
        reply.code(400);
        return { error: "Invalid or missing stream key" };
      }

      try {
        const randomIndex = Math.floor(Math.random() * RANDOM_PROMPTS.length);
        const promptText = RANDOM_PROMPTS[randomIndex];

        const prompt = appState.redis.createPrompt(promptText, streamKey);
        const queuePosition = await appState.redis.addPromptToQueue(prompt);

        console.log(
          `Random prompt added: ${prompt.id} (queue position: ${queuePosition})`,
        );

        try {
          const recentEntries = await appState.redis.getRecentPrompts(
            streamKey,
            20,
          );
          const recentPrompts: RecentPromptItem[] = recentEntries.map(
            (entry: PromptQueueEntry) => ({
              id: entry.prompt.id,
              text: entry.prompt.content,
              timestamp: new Date(entry.added_at).getTime(),
            }),
          );

          const wsMessage: WsMessage = {
            type: "RecentPromptsUpdate",
            recent_prompts: recentPrompts,
            stream_key: streamKey,
          };

          await appState.broadcastMessage(wsMessage);
        } catch (error) {
          console.error("Failed to broadcast recent prompts update:", error);
        }

        return {
          id: prompt.id,
          message: "Random prompt added successfully",
          queue_position: queuePosition,
        };
      } catch (error) {
        console.error("Failed to add random prompt to queue:", error);
        reply.code(500);
        return { error: "Internal server error" };
      }
    },
  );
}
