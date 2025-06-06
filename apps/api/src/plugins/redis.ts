import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { RedisClient } from "../services/redis";

declare module "fastify" {
  interface FastifyInstance {
    redis: RedisClient;
  }
}

const redisPlugin: FastifyPluginAsync = async fastify => {
  const redis = new RedisClient(
    process.env.REDIS_HOST || "localhost",
    parseInt(process.env.REDIS_PORT || "6379"),
    process.env.REDIS_PASSWORD,
    process.env.REDIS_USERNAME,
  );

  await redis.connect();

  fastify.decorate("redis", redis);

  fastify.addHook("onClose", async () => {
    await redis.disconnect();
  });

  fastify.log.info("Redis client initialized");
};

export default fp(redisPlugin, {
  name: "redis",
  dependencies: ["config"],
});
