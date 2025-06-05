import fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { ConfigManager } from "./config";
import { RedisClient } from "./services/redis";
import { AppState } from "./appState";
import { PromptManager } from "./services/promptManager";
import { registerApiRoutes } from "./handlers/api";
import { Prompt } from "./types";

const INITIAL_PROMPTS = [
  "cyberpunk cityscape with neon lights --quality 3",
  "underwater scene with ((bioluminescent)) creatures --creativity 0.8",
  "forest with magical creatures and (((glowing plants))) --quality 2",
  "cosmic nebula with vibrant colors --creativity 0.7",
  "futuristic landscape with floating islands --quality 3",
  "post-apocalyptic desert with abandoned technology --quality 2.5",
  "steampunk airship battle in stormy skies --creativity 0.9",
  "crystalline cave with ((magical)) light reflections --quality 3",
  "ancient library with impossible architecture --creativity 0.8",
  "digital realm with data visualized as (((geometric structures))) --quality 2.5",
  "northern lights over snow-covered mountains --creativity 0.7",
  "microscopic view of exotic (((alien cells))) --quality 3",
  "ancient temple in a jungle with mystical fog --quality 2.8",
  "futuristic city with hovering vehicles and holographic ads --creativity 0.9",
  "magical underwater kingdom with merfolk architecture --quality 3",
  "cosmic gateway with swirling energy patterns --creativity 0.85",
  "crystal forest with rainbow light refractions --quality 2.7",
  "surreal dreamscape with floating islands and impossible physics --creativity 0.95",
  "ancient mechanical clockwork city --quality 3",
  "bioluminescent deep sea creatures in the abyss --creativity 0.8",
  "floating islands with waterfalls cascading into the void --quality 2.9",
  "enchanted forest with magical creatures and fairy lights --creativity 0.75",
  "cybernetic dragon with glowing circuit patterns --quality 3",
];

async function initializeRedisWithDefaultPrompts(
  redis: RedisClient,
  streamKeys: string[],
): Promise<void> {
  const shuffledPrompts = [...INITIAL_PROMPTS].sort(() => Math.random() - 0.5);

  for (const streamKey of streamKeys) {
    try {
      const recentPrompts = await redis.getRecentPrompts(streamKey, 1);

      if (recentPrompts.length === 0) {
        console.log(
          `No chat history found for stream ${streamKey}, initializing with default prompts`,
        );

        for (const promptText of shuffledPrompts) {
          const prompt = redis.createPrompt(promptText, streamKey);
          await redis.addPromptToQueue(prompt);
        }

        console.log(
          `Added ${shuffledPrompts.length} shuffled initial prompts to stream ${streamKey}`,
        );
      } else {
        console.log(`Stream ${streamKey} already has chat history`);
      }
    } catch (error) {
      console.error(
        `Failed to initialize prompts for stream ${streamKey}:`,
        error,
      );
    }
  }
}

async function sendInitialData(
  connection: any,
  redisClient: RedisClient,
  streamKey: string,
): Promise<void> {
  try {
    const currentPrompt = await redisClient.getCurrentPrompt(streamKey);
    const recentEntries = await redisClient.getRecentPrompts(streamKey, 20);

    const recentPrompts = recentEntries.map(entry => ({
      id: entry.prompt.id,
      text: entry.prompt.content,
      timestamp: new Date(entry.added_at).getTime(),
    }));

    const initialData = {
      type: "initial",
      payload: {
        currentPrompt,
        recentPrompts,
        streamKey,
      },
    };

    connection.send(JSON.stringify(initialData));
  } catch (error) {
    console.error("Failed to send initial WebSocket data:", error);
    throw error;
  }
}

async function createServer() {
  const config = ConfigManager.fromEnv();
  console.log("Configuration loaded");

  const redisClient = new RedisClient(config.redis_url);
  await redisClient.connect();
  console.log("Connected to Redis");

  try {
    await initializeRedisWithDefaultPrompts(redisClient, config.stream_keys);
  } catch (error) {
    console.error("Failed to initialize Redis with default prompts:", error);
  }

  const appState = new AppState(redisClient, config);

  const app = fastify({
    logger: false,
  });

  // Register CORS
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(websocket);

  registerApiRoutes(app, appState);

  app.register(async function (fastify) {
    fastify.get("/ws", { websocket: true }, (connection, req) => {
      const query = req.query as { streamKey?: string };
      const streamKey =
        query.streamKey || config.stream_keys[0] || "default-stream";

      const clientId = appState.addClient(connection, streamKey);

      console.log(
        `Client ${clientId} attempting to connect to stream ${streamKey}`,
      );

      connection.on("message", (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          console.log(
            `Received WebSocket message from client ${clientId}:`,
            data,
          );
        } catch (error) {
          console.warn(
            `Invalid JSON in WebSocket message from client ${clientId}:`,
            error,
          );
        }
      });

      connection.on("ping", () => {
        console.log(`Received ping from client ${clientId}`);
      });

      connection.on("pong", () => {
        console.log(`Received pong from client ${clientId}`);
      });

      sendInitialData(connection, redisClient, streamKey).catch(error => {
        console.error(
          `Failed to send initial data to client ${clientId}:`,
          error,
        );
        connection.close();
      });

      console.log(`Client ${clientId} connected to stream ${streamKey}`);
    });
  });

  const promptManager = new PromptManager(appState);
  promptManager.start();

  const gracefulShutdown = async () => {
    console.log("Shutting down gracefully...");
    promptManager.stop();
    await redisClient.disconnect();
    await app.close();
    process.exit(0);
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);

  return { app, config };
}

async function main() {
  try {
    const { app, config } = await createServer();

    const address = await app.listen({
      port: config.server_port,
      host: "0.0.0.0",
    });

    console.log(`Server listening on ${address}`);
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

// Start the server
main().catch(console.error);
