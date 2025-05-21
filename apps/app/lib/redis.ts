import { Redis } from "@upstash/redis";
import { redisConfig } from "./serverEnv";

export const redis = new Redis({
  url: redisConfig.url,
  token: redisConfig.token,
});
