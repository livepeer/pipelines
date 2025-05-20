import { Redis } from "@upstash/redis";
import { serverConfig } from "./serverEnv";

const config = await serverConfig();

const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

interface Prompt {
  sender: string;
  prompt: string;
  timestamp: number;
}

const STREAM_KEY = "test";
const MULTIPLAYER_CHANNEL_KEY = `multiplayer-stream-${STREAM_KEY}`;
const MAX_MESSAGES_LIMIT = 200;

export async function publishPrompt(promptInfo: Prompt) {
  await redis.publish(MULTIPLAYER_CHANNEL_KEY, JSON.stringify(promptInfo));
}

export async function storePrompt(promptInfo: Prompt) {
  await redis.lpush(MULTIPLAYER_CHANNEL_KEY, JSON.stringify(promptInfo));
  await redis.ltrim(MULTIPLAYER_CHANNEL_KEY, 0, MAX_MESSAGES_LIMIT); // Keep only the last 100 messages
}

export async function getPrompts(): Promise<Prompt[]> {
  const promptInfoList = await redis.lrange(MULTIPLAYER_CHANNEL_KEY, 0, -1);
  return promptInfoList
    .map(promptInfo => {
      try {
        const parsedPromptInfo = JSON.parse(promptInfo) as Prompt;
        return {
          sender: parsedPromptInfo.sender || "Unknown",
          prompt: parsedPromptInfo.prompt || "",
          timestamp: parsedPromptInfo.timestamp || Date.now(),
        };
      } catch (error) {
        console.error("Error parsing prompt info:", promptInfo);
        return null;
      }
    })
    .filter((promptInfo: Prompt | null) => promptInfo !== null);
}

export async function getLatestPrompts(
  lastTimestamp: number,
): Promise<Prompt[]> {
  const promptInfos = await getPrompts();
  return promptInfos.filter(promptInfo => promptInfo.timestamp > lastTimestamp);
}
