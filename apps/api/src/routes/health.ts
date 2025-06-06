import { FastifyPluginAsync } from "fastify";

const healthRoute: FastifyPluginAsync = async fastify => {
  fastify.get("/health", async () => {
    return "OK";
  });
};

export default healthRoute;
