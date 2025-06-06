import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";

const corsPlugin: FastifyPluginAsync = async fastify => {
  await fastify.register(require("@fastify/cors"), {
    origin: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "authorization"],
  });

  fastify.log.info("CORS plugin initialized");
};

export default fp(corsPlugin, {
  name: "cors",
});
