"use server";

import { Kafka, Producer, Message } from "kafkajs";
import { serverConfig } from "@/lib/serverEnv";

const KAFKA_BATCH_INTERVAL = 1000; // 1 second
const KAFKA_REQUEST_TIMEOUT = 5000; // 5 seconds
const KAFKA_BATCH_SIZE = 100;
const KAFKA_CHANNEL_SIZE = 100;
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

class KafkaProducer {
  private producer: Producer;
  private topic: string;
  private events: NetworkEvent[];
  private batchTimeout: NodeJS.Timeout | null;

  constructor(
    bootstrapServers: string,
    username: string,
    password: string,
    topic: string,
  ) {
    const kafka = new Kafka({
      brokers: [bootstrapServers],
      ssl: true,
      sasl: {
        mechanism: "plain",
        username,
        password,
      },
      connectionTimeout: KAFKA_CONNECTION_TIMEOUT,
      authenticationTimeout: KAFKA_AUTH_TIMEOUT,
      retry: {
        initialRetryTime: 300,
        retries: 10,
        maxRetryTime: 30000,
        factor: 0.2,
      },
    });

    this.producer = kafka.producer({
      allowAutoTopicCreation: false,
      transactionTimeout: 30000,
    });
    this.topic = topic;
    this.events = [];
    this.batchTimeout = null;
  }

  async connect() {
    try {
      console.log('Connecting to Kafka...');
      await this.producer.connect();
      console.log('Successfully connected to Kafka');
      this.processBatch();
    } catch (error) {
      console.error('Failed to connect to Kafka:', error);
      throw error;
    }
  }

  private processBatch = async () => {
    if (this.events.length >= KAFKA_BATCH_SIZE) {
      await this.sendBatch();
    }

    this.batchTimeout = setTimeout(async () => {
      if (this.events.length > 0) {
        await this.sendBatch();
      }
      this.processBatch();
    }, KAFKA_BATCH_INTERVAL);
  };

  private async sendBatch() {
    if (this.events.length === 0) return;

    const messages: Message[] = this.events.map(event => ({
      key: event.id,
      value: JSON.stringify(event),
    }));

    const retries = 3;
    for (let i = 0; i < retries; i++) {
      try {
        await this.producer.send({
          topic: this.topic,
          messages,
          timeout: KAFKA_REQUEST_TIMEOUT,
        });
        console.log(`Successfully sent ${messages.length} messages to Kafka`);
        this.events = [];
        return;
      } catch (error) {
        console.warn(`Error sending batch to Kafka, retry ${i + 1}`, error);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        
        if (i === retries - 1) {
          console.error("Failed to send batch to Kafka after retries", error);
          try {
            console.log('Attempting to reconnect to Kafka...');
            await this.producer.disconnect();
            await this.producer.connect();
            console.log('Successfully reconnected to Kafka');
          } catch (reconnectError) {
            console.error("Failed to reconnect to Kafka", reconnectError);
          }
        }
      }
    }
  }

  async sendEvent(eventType: string, data: any, app: string, host: string) {
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

    console.log("[Kafka Event] Queueing event:", eventType, JSON.stringify(event, null, 2));

    if (this.events.length < KAFKA_CHANNEL_SIZE) {
      this.events.push(event);
    } else {
      console.warn(
        `Kafka producer event queue is full, dropping event ${eventType}`,
      );
    }
  }

  async disconnect() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    try {
      await this.sendBatch(); // Send any remaining events
      await this.producer.disconnect();
      console.log('Successfully disconnected from Kafka');
    } catch (error) {
      console.error('Error disconnecting from Kafka:', error);
    }
  }
}

let kafkaProducer: KafkaProducer | null = null;

export async function initKafkaProducer() {
  try {
    const config = await serverConfig();
    const kafka = config.kafka;

    if (!kafka?.bootstrapServers || !kafka?.username || !kafka?.password) {
      console.warn(
        "Kafka configuration missing, producer will not be initialized",
      );
      return;
    }

    console.log('Initializing Kafka producer...');
    
    kafkaProducer = new KafkaProducer(
      kafka.bootstrapServers,
      kafka.username,
      kafka.password,
      "network_events",
    );

    await kafkaProducer.connect();
    console.log('Kafka producer initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Kafka producer:', error);
    // Reset the producer if initialization fails
    kafkaProducer = null;
  }
}

export async function sendKafkaEvent(
  eventType: string,
  data: any,
  app: string,
  host: string,
) {
  try {
    if (!kafkaProducer) {
      await initKafkaProducer();
      if (!kafkaProducer) {
        console.error('Failed to initialize Kafka producer, event not sent');
        return;
      }
    }
    await kafkaProducer.sendEvent(eventType, data, app, host);
  } catch (error) {
    console.error('Error sending Kafka event:', error);
  }
}
