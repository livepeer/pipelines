import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { PromptManager } from "../services/prompt-manager";

declare module "fastify" {
  interface FastifyInstance {
    promptManager: PromptManager;
  }
}

const promptManagerPlugin: FastifyPluginAsync = async fastify => {
  const promptManager = new PromptManager(fastify);

  fastify.decorate("promptManager", promptManager);

  await promptManager.start();

  fastify.addHook("onClose", async () => {
    promptManager.stop();
  });

  fastify.log.info("Prompt manager plugin initialized");
};

export default fp(promptManagerPlugin, {
  name: "prompt-manager",
  dependencies: ["config", "redis", "websocket"],
});
