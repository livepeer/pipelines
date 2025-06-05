import { FastifyPluginAsync } from "fastify";
import {
  SubmitPromptRequest,
  SubmitPromptResponse,
  PromptQuery,
  RecentPromptItem,
  WsMessage,
} from "../types/models";
import { createPrompt } from "../services/redis";

const promptsRoute: FastifyPluginAsync = async fastify => {
  // Submit a new prompt
  fastify.post<{ Body: SubmitPromptRequest }>(
    "/prompts",
    {
      schema: {
        body: {
          type: "object",
          required: ["text", "streamKey"],
          properties: {
            text: { type: "string", minLength: 1 },
            streamKey: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { text, streamKey } = request.body;

      if (text.trim().length === 0) {
        return reply.status(400).send({ error: "Text cannot be empty" });
      }

      if (!fastify.config.stream_keys.includes(streamKey)) {
        return reply.status(400).send({ error: "Invalid stream key" });
      }

      try {
        const prompt = createPrompt(text, streamKey);
        const queuePosition = await fastify.redis.addPromptToQueue(prompt);

        fastify.log.info(
          `New prompt submitted: ${prompt.id} (queue position: ${queuePosition})`,
        );

        // Broadcast recent prompts update
        try {
          const recentEntries = await fastify.redis.getRecentPrompts(
            streamKey,
            20,
          );
          const recentPrompts: RecentPromptItem[] = recentEntries.map(
            entry => ({
              id: entry.prompt.id,
              text: entry.prompt.content,
              timestamp: entry.added_at.getTime(),
            }),
          );

          const wsMessage: WsMessage = {
            type: "RecentPromptsUpdate",
            payload: {
              recent_prompts: recentPrompts,
              stream_key: streamKey,
            },
          };

          fastify.broadcastMessage(wsMessage);
        } catch (err) {
          fastify.log.warn("Failed to broadcast recent prompts update:", err);
        }

        const response: SubmitPromptResponse = {
          id: prompt.id,
          message: "Prompt submitted successfully",
          queue_position: queuePosition,
        };

        return response;
      } catch (error) {
        fastify.log.error("Failed to add prompt to queue:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );

  // Get prompt state
  fastify.get<{ Querystring: PromptQuery }>(
    "/prompts",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["streamKey"],
          properties: {
            streamKey: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { streamKey } = request.query;

      if (!fastify.config.stream_keys.includes(streamKey)) {
        return reply.status(400).send({ error: "Invalid stream key" });
      }

      try {
        const [currentPrompt, recentEntries] = await Promise.all([
          fastify.redis.getCurrentPrompt(streamKey),
          fastify.redis.getRecentPrompts(streamKey, 20),
        ]);

        const recentPrompts: RecentPromptItem[] = recentEntries.map(entry => ({
          id: entry.prompt.id,
          text: entry.prompt.content,
          timestamp: entry.added_at.getTime(),
        }));

        return {
          currentPrompt,
          recentPrompts,
          streamKey,
        };
      } catch (error) {
        fastify.log.error("Failed to get prompt state:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );

  // Add random prompt
  fastify.put<{ Querystring: PromptQuery }>(
    "/prompts",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["streamKey"],
          properties: {
            streamKey: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { streamKey } = request.query;

      if (!fastify.config.stream_keys.includes(streamKey)) {
        return reply.status(400).send({ error: "Invalid stream key" });
      }

      const randomPrompts = [
        "A serene landscape with mountains and a lake",
        "A futuristic city with flying cars",
        "A magical forest with glowing mushrooms",
        "An underwater scene with colorful coral reefs",
        "A steampunk workshop with intricate machinery",
        "A cozy cabin in a snowy forest",
        "A vibrant sunset over the ocean",
        "A mystical castle floating in the clouds",
        "A bustling marketplace in an ancient city",
        "A peaceful zen garden with cherry blossoms",
      ];

      try {
        const randomIndex = Math.floor(Math.random() * randomPrompts.length);
        const promptText = randomPrompts[randomIndex];

        const prompt = createPrompt(promptText, streamKey);
        const queuePosition = await fastify.redis.addPromptToQueue(prompt);

        fastify.log.info(
          `Random prompt added: ${prompt.id} (queue position: ${queuePosition})`,
        );

        // Broadcast recent prompts update
        try {
          const recentEntries = await fastify.redis.getRecentPrompts(
            streamKey,
            20,
          );
          const recentPrompts: RecentPromptItem[] = recentEntries.map(
            entry => ({
              id: entry.prompt.id,
              text: entry.prompt.content,
              timestamp: entry.added_at.getTime(),
            }),
          );

          const wsMessage: WsMessage = {
            type: "RecentPromptsUpdate",
            payload: {
              recent_prompts: recentPrompts,
              stream_key: streamKey,
            },
          };

          fastify.broadcastMessage(wsMessage);
        } catch (err) {
          fastify.log.warn("Failed to broadcast recent prompts update:", err);
        }

        return {
          id: prompt.id,
          message: "Random prompt added successfully",
          queue_position: queuePosition,
        };
      } catch (error) {
        fastify.log.error("Failed to add random prompt to queue:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );
};

export default promptsRoute;
