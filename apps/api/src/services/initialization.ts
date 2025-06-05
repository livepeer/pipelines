import { FastifyInstance } from "fastify";
import { createPrompt } from "./redis";

const INITIAL_PROMPTS = [
  "cyberpunk cityscape with neon lights --quality 3",
  "underwater scene with ((bioluminescent)) creatures --creativity 0.8",
  "forest with magical creatures and (((glowing plants))) --quality 2",
  "cosmic nebula with vibrant colors --creativity 0.7",
  "futuristic landscape with floating islands --quality 3",
  "post-apocalyptic desert with abandoned technology --quality 2.5",
  "steampunk airship battle in stormy skies --creativity 0.9",
  "crystalline cave with ((magical)) light reflections --quality 3",
  "ancient library with impossible architecture --creativity 0.8",
  "digital realm with data visualized as (((geometric structures))) --quality 2.5",
  "northern lights over snow-covered mountains --creativity 0.7",
  "microscopic view of exotic (((alien cells))) --quality 3",
  "ancient temple in a jungle with mystical fog --quality 2.8",
  "futuristic city with hovering vehicles and holographic ads --creativity 0.9",
  "magical underwater kingdom with merfolk architecture --quality 3",
  "cosmic gateway with swirling energy patterns --creativity 0.85",
  "crystal forest with rainbow light refractions --quality 2.7",
  "surreal dreamscape with floating islands and impossible physics --creativity 0.95",
  "ancient mechanical clockwork city --quality 3",
  "bioluminescent deep sea creatures in the abyss --creativity 0.8",
  "floating islands with waterfalls cascading into the void --quality 2.9",
  "enchanted forest with magical creatures and fairy lights --creativity 0.75",
  "cybernetic dragon with glowing circuit patterns --quality 3",
];

export async function initializeRedisWithDefaultPrompts(
  fastify: FastifyInstance,
): Promise<void> {
  for (const streamKey of fastify.config.stream_keys) {
    try {
      const recentPrompts = await fastify.redis.getRecentPrompts(streamKey, 1);

      if (recentPrompts.length === 0) {
        fastify.log.info(
          `No chat history found for stream ${streamKey}, initializing with default prompts`,
        );

        // Shuffle the prompts
        const shuffledPrompts = [...INITIAL_PROMPTS].sort(
          () => Math.random() - 0.5,
        );

        for (const promptText of shuffledPrompts) {
          const prompt = createPrompt(promptText, streamKey);
          await fastify.redis.addPromptToQueue(prompt);
        }

        fastify.log.info(
          `Added ${shuffledPrompts.length} shuffled initial prompts to stream ${streamKey}`,
        );
      } else {
        fastify.log.info(`Stream ${streamKey} already has chat history`);
      }
    } catch (error) {
      fastify.log.error(
        `Failed to initialize Redis with default prompts for stream ${streamKey}:`,
        error,
      );
    }
  }
}
