import { FastifyPluginAsync } from "fastify";
import { WebSocket } from "@fastify/websocket";
import { WsQuery, WsMessage, RecentPromptItem } from "../types/models";
import { v4 as uuidv4 } from "uuid";

const ws: FastifyPluginAsync = async function (fastify) {
  fastify.get<{ Querystring: WsQuery }>(
    "/ws",
    { websocket: true },
    (socket: WebSocket, request) => {
      const clientId = uuidv4();
      const query = request.query;

      // Get stream key from query or use first available stream key
      const streamKey =
        query.streamKey || fastify.config?.stream_keys?.[0] || "default-stream";

      fastify.log.info(
        `Client ${clientId} attempting to connect to stream ${streamKey}`,
      );

      // Send initial data
      sendInitialData(socket, fastify, streamKey)
        .then(() => {
          fastify.log.info(
            `Client ${clientId} connected to stream ${streamKey}`,
          );
        })
        .catch(error => {
          fastify.log.error(
            `Failed to send initial data to client ${clientId}: ${error}`,
          );
          socket.close();
          return;
        });

      // Listen for broadcast messages
      const messageHandler = (message: WsMessage) => {
        const shouldSend = shouldSendMessage(message, streamKey);

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

      // Subscribe to broadcasts
      fastify.websocketBroadcast.on("message", messageHandler);

      // Handle client messages
      socket.on("message", (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          fastify.log.info(
            `Received message from client ${clientId}:`,
            message,
          );
          // Handle different message types if needed
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
          `Client ${clientId} disconnected from stream ${streamKey}`,
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

async function sendInitialData(
  socket: WebSocket,
  fastify: any,
  streamKey: string,
): Promise<void> {
  try {
    // Get current prompt from Redis
    const currentPrompt = await fastify.redis.getCurrentPrompt(streamKey);

    // Get recent prompts from Redis
    const recentEntries = await fastify.redis.getRecentPrompts(streamKey, 20);
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
        streamKey,
      },
    };

    socket.send(JSON.stringify(initialMessage));
  } catch (error) {
    throw new Error(`Failed to send initial data: ${error}`);
  }
}

function shouldSendMessage(message: WsMessage, streamKey: string): boolean {
  switch (message.type) {
    case "CurrentPrompt":
      return message.payload.stream_key === streamKey;
    case "RecentPromptsUpdate":
      return message.payload.stream_key === streamKey;
    case "initial":
      return message.payload.streamKey === streamKey;
    default:
      return false;
  }
}

export default ws;
