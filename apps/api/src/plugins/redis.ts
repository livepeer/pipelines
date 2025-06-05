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
    `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
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
