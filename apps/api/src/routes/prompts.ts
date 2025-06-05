import { FastifyPluginAsync } from "fastify";
import {
  SubmitPromptRequest,
  SubmitPromptResponse,
  RecentPromptItem,
  WsMessage,
} from "../types/models";
import { createPrompt } from "../services/redis";
import { streams } from "../db/schema";
import { eq } from "drizzle-orm";

// const INITIAL_PROMPTS = [
//   "cyberpunk cityscape with neon lights --quality 3",
//   "underwater scene with ((bioluminescent)) creatures --creativity 0.8",
//   "forest with magical creatures and (((glowing plants))) --quality 2",
//   "cosmic nebula with vibrant colors --creativity 0.7",
//   "futuristic landscape with floating islands --quality 3",
//   "post-apocalyptic desert with abandoned technology --quality 2.5",
//   "steampunk airship battle in stormy skies --creativity 0.9",
//   "crystalline cave with ((magical)) light reflections --quality 3",
//   "ancient library with impossible architecture --creativity 0.8",
//   "digital realm with data visualized as (((geometric structures))) --quality 2.5",
//   "northern lights over snow-covered mountains --creativity 0.7",
//   "microscopic view of exotic (((alien cells))) --quality 3",
//   "ancient temple in a jungle with mystical fog --quality 2.8",
//   "futuristic city with hovering vehicles and holographic ads --creativity 0.9",
//   "magical underwater kingdom with merfolk architecture --quality 3",
//   "cosmic gateway with swirling energy patterns --creativity 0.85",
//   "crystal forest with rainbow light refractions --quality 2.7",
//   "surreal dreamscape with floating islands and impossible physics --creativity 0.95",
//   "ancient mechanical clockwork city --quality 3",
//   "bioluminescent deep sea creatures in the abyss --creativity 0.8",
//   "floating islands with waterfalls cascading into the void --quality 2.9",
//   "enchanted forest with magical creatures and fairy lights --creativity 0.75",
//   "cybernetic dragon with glowing circuit patterns --quality 3",
// ];

const promptsRoute: FastifyPluginAsync = async fastify => {
  fastify.post<{ Body: SubmitPromptRequest; Params: { streamId: string } }>(
    "/streams/:streamId/prompts",
    {
      schema: {
        params: {
          type: "object",
          required: ["streamId"],
          properties: {
            streamId: { type: "string", minLength: 1 },
          },
        },
        body: {
          type: "object",
          required: ["text"],
          properties: {
            text: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { text } = request.body;
      const { streamId } = request.params;

      if (text.trim().length === 0) {
        return reply.status(400).send({ error: "Text cannot be empty" });
      }

      try {
        const stream = await fastify.db.query.streams.findFirst({
          where: eq(streams.id, streamId),
        });

        if (!stream) {
          return reply.status(404).send({ error: "Stream not found" });
        }

        if (!stream.gatewayHost || !stream.streamKey) {
          return reply.status(404).send({ error: "Stream not ready yet" });
        }

        const submitUrl = `https://${stream.gatewayHost}/live/video-to-video/${stream.streamKey}/update`;
        const prompt = createPrompt(text, streamId, submitUrl);
        const queuePosition = await fastify.redis.addPromptToQueue(prompt);

        fastify.log.info(
          `New prompt submitted: ${prompt.id} (queue position: ${queuePosition})`,
        );

        try {
          await fastify.promptManager.schedulePromptCheck(streamId);
        } catch (err) {
          fastify.log.warn("Failed to schedule prompt check:", err);
        }

        try {
          const recentEntries = await fastify.redis.getRecentPrompts(
            streamId,
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
              stream_id: streamId,
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

  fastify.get<{ Params: { streamId: string } }>(
    "/streams/:streamId/prompts",
    {
      schema: {
        params: {
          type: "object",
          required: ["streamId"],
          properties: {
            streamId: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { streamId } = request.params;

      try {
        let [currentPrompt, recentEntries] = await Promise.all([
          fastify.redis.getCurrentPrompt(streamId),
          fastify.redis.getRecentPrompts(streamId, 20),
        ]);

        if (!currentPrompt && recentEntries.length === 0) {
          fastify.log.info(
            `No prompts found for stream ${streamId}, initializing with default prompts`,
          );

          // const shuffledPrompts = [...INITIAL_PROMPTS].sort(
          //   () => Math.random() - 0.5,
          // );

          // const stream = await fastify.db.query.streams.findFirst({
          //   where: eq(streams.id, streamId),
          // });

          // if (!stream) {
          //   return reply.status(404).send({ error: "Stream not found" });
          // }

          // if (!stream.gatewayHost || !stream.streamKey) {
          //   return reply.status(404).send({ error: "Stream not ready yet" });
          // }

          // const submitUrl = `https://${stream.gatewayHost}/live/video-to-video/${stream.streamKey}/update`;

          // for (const promptText of shuffledPrompts) {
          //   const prompt = createPrompt(promptText, streamId, submitUrl);
          //   await fastify.redis.addPromptToQueue(prompt);
          // }

          // fastify.log.info(
          //   `Added ${shuffledPrompts.length} shuffled initial prompts to stream ${streamId}`,
          // );

          try {
            await fastify.promptManager.schedulePromptCheck(streamId);
          } catch (err) {
            fastify.log.warn("Failed to schedule prompt check:", err);
          }

          [currentPrompt, recentEntries] = await Promise.all([
            fastify.redis.getCurrentPrompt(streamId),
            fastify.redis.getRecentPrompts(streamId, 20),
          ]);
        }

        const recentPrompts: RecentPromptItem[] = recentEntries.map(entry => ({
          id: entry.prompt.id,
          text: entry.prompt.content,
          timestamp: entry.added_at.getTime(),
        }));

        return {
          currentPrompt,
          recentPrompts,
          streamId,
        };
      } catch (error) {
        fastify.log.error("Failed to get prompt state:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );

  fastify.put<{ Params: { streamId: string } }>(
    "/streams/:streamId/prompts",
    {
      schema: {
        params: {
          type: "object",
          required: ["streamId"],
          properties: {
            streamId: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { streamId } = request.params;

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

        const prompt = createPrompt(promptText, streamId, "");
        const queuePosition = await fastify.redis.addPromptToQueue(prompt);

        fastify.log.info(
          `Random prompt added: ${prompt.id} (queue position: ${queuePosition})`,
        );

        try {
          await fastify.promptManager.schedulePromptCheck(streamId);
        } catch (err) {
          fastify.log.warn("Failed to schedule prompt check:", err);
        }

        try {
          const recentEntries = await fastify.redis.getRecentPrompts(
            streamId,
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
              stream_id: streamId,
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
