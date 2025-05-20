import { Redis } from "@upstash/redis";
import { serverConfig } from "./serverEnv";

const config = await serverConfig();

export const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});
