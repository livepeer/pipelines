"use server";

import { Kafka } from "kafkajs";
import { serverConfig } from "@/lib/serverEnv";

const KAFKA_REQUEST_TIMEOUT = 5000; // 5 seconds
const KAFKA_CONNECTION_TIMEOUT = 10000; // 10 seconds
const KAFKA_AUTH_TIMEOUT = 10000; // 10 seconds

interface NetworkEvent {
  id?: string;
  type: string;
  timestamp: string;
  data: any;
  sender: {
    type: string;
    id: string;
    host: string;
  };
}

// TODO: this is a hacky temp fix, move to a permanent solution
export async function sendKafkaEvent(
  eventType: string,
  data: any,
  app: string,
  host: string,
) {
  const config = await serverConfig();
  const kafkaConfig = config.kafka;
  if (!kafkaConfig?.bootstrapServers || !kafkaConfig?.username || !kafkaConfig?.password) {
    console.log("[Kafka Event] Missing configuration, aborting event send");
    return;
  }

  const kafka = new Kafka({
    brokers: [kafkaConfig.bootstrapServers],
    ssl: true,
    sasl: {
      mechanism: "plain",
      username: kafkaConfig.username,
      password: kafkaConfig.password,
    },
    connectionTimeout: KAFKA_CONNECTION_TIMEOUT,
    authenticationTimeout: KAFKA_AUTH_TIMEOUT,
  });

  const producer = kafka.producer({
    allowAutoTopicCreation: false,
    transactionTimeout: 30000,
  });

  const event: NetworkEvent = {
    id: crypto.randomUUID(),
    type: eventType,
    sender: {
      type: "app",
      id: app,
      host: host,
    },
    timestamp: Date.now().toString(),
    data,
  };

  try {
    await producer.connect();
    console.log("[Kafka Event] Producer connected, now sending event:", JSON.stringify(event));
    await producer.send({
      topic: "network_events",
      messages: [
        {
          key: event.id,
          value: JSON.stringify(event),
        },
      ],
      timeout: KAFKA_REQUEST_TIMEOUT,
    });
    console.log("[Kafka Event] Event sent successfully");
  } catch (error) {
    console.error("[Kafka Event] Error sending event", error);
  } finally {
    await producer.disconnect();
    console.log("[Kafka Event] Producer disconnected");
  }
}
