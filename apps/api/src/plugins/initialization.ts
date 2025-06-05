import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { initializeRedisWithDefaultPrompts } from "../services/initialization";

const initializationPlugin: FastifyPluginAsync = async fastify => {
  // Initialize Redis with default prompts
  await initializeRedisWithDefaultPrompts(fastify);

  fastify.log.info("Initialization plugin completed");
};

export default fp(initializationPlugin, {
  name: "initialization",
  dependencies: ["config", "redis"],
});
