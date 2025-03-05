import { Kafka, Producer, Message } from "kafkajs";
import { serverConfig } from "@/lib/serverEnv";

const KAFKA_BATCH_INTERVAL = 1000; // 1 second
const KAFKA_REQUEST_TIMEOUT = 60000; // 60 seconds
const KAFKA_BATCH_SIZE = 100;
const KAFKA_CHANNEL_SIZE = 100;

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
    });

    this.producer = kafka.producer();
    this.topic = topic;
    this.events = [];
    this.batchTimeout = null;
  }

  async connect() {
    await this.producer.connect();
    this.processBatch();
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
        this.events = [];
        return;
      } catch (error) {
        console.warn(`Error sending batch to Kafka, retry ${i + 1}`, error);
        if (i === retries - 1) {
          console.error("Failed to send batch to Kafka after retries", error);
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
    await this.sendBatch(); // Send any remaining events
    await this.producer.disconnect();
  }
}

let kafkaProducer: KafkaProducer | null = null;

export async function initKafkaProducer() {
  const config = await serverConfig();
  const kafka = config.kafka;

  if (!kafka?.bootstrapServers || !kafka?.username || !kafka?.password) {
    console.warn(
      "Kafka configuration missing, producer will not be initialized",
    );
    return;
  }

  kafkaProducer = new KafkaProducer(
    kafka.bootstrapServers,
    kafka.username,
    kafka.password,
    "temp_testing_vb",
  );

  await kafkaProducer.connect();
}

export async function sendKafkaEvent(
  eventType: string,
  data: any,
  app: string,
  host: string,
) {
  if (!kafkaProducer) return;
  await kafkaProducer.sendEvent(eventType, data, app, host);
}
