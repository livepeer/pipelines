import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import { RedisClient } from "./services/redis";
import { Config, WsMessage, WebSocketClient } from "./types";

export class AppState extends EventEmitter {
  public readonly redis: RedisClient;
  public readonly config: Config;
  private wsClients = new Map<string, WebSocketClient>();

  constructor(redis: RedisClient, config: Config) {
    super();
    this.redis = redis;
    this.config = config;
  }

  public addClient(connection: any, streamKey: string): string {
    const clientId = uuidv4();
    const client: WebSocketClient = {
      id: clientId,
      connection,
      streamKey,
    };

    this.wsClients.set(clientId, client);

    console.log(`Client ${clientId} connected to stream ${streamKey}`);

    connection.on("close", () => {
      this.removeClient(clientId);
    });

    connection.on("error", (error: Error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.removeClient(clientId);
    });

    return clientId;
  }

  public removeClient(clientId: string): void {
    const client = this.wsClients.get(clientId);
    if (client) {
      this.wsClients.delete(clientId);
      console.log(
        `Client ${clientId} disconnected from stream ${client.streamKey}`,
      );
    }
  }

  public async broadcastMessage(message: WsMessage): Promise<void> {
    const messageString = JSON.stringify(message);
    const targetStreamKey = message.stream_key;

    // Filter clients by stream key
    const targetClients = Array.from(this.wsClients.values()).filter(
      client => client.streamKey === targetStreamKey,
    );

    console.log(
      `Broadcasting ${message.type} message to ${targetClients.length} clients on stream ${targetStreamKey}`,
    );

    const disconnectedClients: string[] = [];

    for (const client of targetClients) {
      try {
        if (client.connection.readyState === 1) {
          // WebSocket.OPEN
          client.connection.send(messageString);
        } else {
          disconnectedClients.push(client.id);
        }
      } catch (error) {
        console.error(`Failed to send message to client ${client.id}:`, error);
        disconnectedClients.push(client.id);
      }
    }

    // Clean up disconnected clients
    for (const clientId of disconnectedClients) {
      this.removeClient(clientId);
    }
  }

  public getClientCount(streamKey?: string): number {
    if (streamKey) {
      return Array.from(this.wsClients.values()).filter(
        client => client.streamKey === streamKey,
      ).length;
    }
    return this.wsClients.size;
  }

  public getActiveStreamKeys(): string[] {
    const streamKeys = new Set<string>();
    for (const client of this.wsClients.values()) {
      streamKeys.add(client.streamKey);
    }
    return Array.from(streamKeys);
  }
}
