import { FastifyPluginAsync } from "fastify";
import { WebSocket } from "@fastify/websocket";
import { WsQuery, WsMessage, RecentPromptItem } from "../types/models";
import { v4 as uuidv4 } from "uuid";
import { createPrompt } from "../services/redis";
import { streams } from "../db/schema";
import { eq } from "drizzle-orm";

const ws: FastifyPluginAsync = async function (fastify) {
  fastify.get<{ Querystring: WsQuery }>(
    "/ws",
    { websocket: true },
    (socket: WebSocket, request) => {
      const clientId = uuidv4();
      const query = request.query;

      const streamId = query.streamId;

      if (!streamId) {
        fastify.log.error(`No streamId provided`);
        socket.close();
        return;
      }

      fastify.log.info(
        `Client ${clientId} attempting to connect to stream ${streamId}`,
      );

      sendInitialData(socket, fastify, streamId)
        .then(() => {
          fastify.log.info(
            `Client ${clientId} connected to stream ${streamId}`,
          );
        })
        .catch(error => {
          fastify.log.error(
            `Failed to send initial data to client ${clientId}: ${error}`,
          );
          socket.close();
          return;
        });

      const messageHandler = (message: WsMessage) => {
        const shouldSend = shouldSendMessage(message, streamId);

        if (shouldSend) {
          try {
            socket.send(JSON.stringify(message));
          } catch (error) {
            fastify.log.error(
              `Failed to send message to client ${clientId}: ${error}`,
            );
          }
        }
      };

      fastify.websocketBroadcast.on("message", messageHandler);

      socket.on("message", (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          fastify.log.info(
            `Received message from client ${clientId}:`,
            message,
          );
        } catch (error) {
          fastify.log.error(
            `Error parsing message from client ${clientId}: ${error}`,
          );
        }
      });
      socket.on("ping", () => {
        fastify.log.info(`Received ping from client ${clientId}`);
      });
      socket.on("pong", () => {
        fastify.log.info(`Received pong from client ${clientId}`);
      });
      socket.on("close", () => {
        fastify.log.info(
          `Client ${clientId} disconnected from stream ${streamId}`,
        );
        fastify.websocketBroadcast.off("message", messageHandler);
      });
      socket.on("error", (error: Error) => {
        fastify.log.error(`WebSocket error for client ${clientId}: ${error}`);
        fastify.websocketBroadcast.off("message", messageHandler);
      });
    },
  );
};

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

async function sendInitialData(
  socket: WebSocket,
  fastify: any,
  streamId: string,
): Promise<void> {
  try {
    let currentPrompt = await fastify.redis.getCurrentPrompt(streamId);
    let recentEntries = await fastify.redis.getRecentPrompts(streamId, 20);

    if (!currentPrompt && recentEntries.length === 0) {
      fastify.log.info(
        `No prompts found for stream ${streamId}, initializing with default prompts`,
      );

      const shuffledPrompts = [...INITIAL_PROMPTS].sort(
        () => Math.random() - 0.5,
      );

      const stream = await fastify.db.query.streams.findFirst({
        where: eq(streams.id, streamId),
      });

      if (!stream.gatewayHost || !stream.streamKey) {
        throw new Error("Stream not ready yet");
      }

      const submitUrl = `https://${stream.gatewayHost}/live/video-to-video/${stream.streamKey}/update`;

      for (const promptText of shuffledPrompts) {
        const prompt = createPrompt(promptText, streamId, submitUrl);
        await fastify.redis.addPromptToQueue(prompt);
      }

      fastify.log.info(
        `Added ${shuffledPrompts.length} shuffled initial prompts to stream ${streamId}`,
      );

      try {
        await fastify.promptManager.schedulePromptCheck(streamId);
      } catch (err) {
        fastify.log.warn("Failed to schedule prompt check:", err);
      }

      currentPrompt = await fastify.redis.getCurrentPrompt(streamId);
      recentEntries = await fastify.redis.getRecentPrompts(streamId, 20);
    }

    const recentPrompts: RecentPromptItem[] = recentEntries.map(
      (entry: any) => ({
        id: entry.prompt.id,
        text: entry.prompt.content,
        timestamp: new Date(entry.added_at).getTime(),
      }),
    );

    const initialMessage = {
      type: "initial" as const,
      payload: {
        currentPrompt,
        recentPrompts,
        streamId,
      },
    };

    socket.send(JSON.stringify(initialMessage));
  } catch (error) {
    throw new Error(`Failed to send initial data: ${error}`);
  }
}

function shouldSendMessage(message: WsMessage, streamId: string): boolean {
  switch (message.type) {
    case "CurrentPrompt":
      return message.payload.stream_id === streamId;
    case "RecentPromptsUpdate":
      return message.payload.stream_id === streamId;
    case "initial":
      return message.payload.streamId === streamId;
    default:
      return false;
  }
}

export default ws;
