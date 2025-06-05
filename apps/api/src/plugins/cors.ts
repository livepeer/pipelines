import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";

const corsPlugin: FastifyPluginAsync = async fastify => {
  await fastify.register(require("@fastify/cors"), {
    origin: true, // Allow all origins (permissive like in Rust version)
    credentials: true,
  });

  fastify.log.info("CORS plugin initialized");
};

export default fp(corsPlugin, {
  name: "cors",
});
