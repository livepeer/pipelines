import { z } from "zod";
import { isProduction } from "./env";

const DBConfig = z.object({
  url: z.string().url(),
});

const SupabaseConfig = z.object({
  url: z.string().url().optional(),
  anonKey: z.string().min(1).optional(),
  serviceRoleKey: z.string().min(1).optional(),
});

const GatewayConfig = z.object({
  url: z.string().url().optional(),
  userId: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
});

const KafkaConfig = z.object({
  bootstrapServers: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
});

const GCPConfig = z.object({
  bucketName: z.string().min(1).optional(),
  credentials: z.string().optional(),
});

const RedisConfig = z.object({
  url: z.string().min(1),
  token: z.string().min(1),
});

export const ServerEnvironmentConfig = z.object({
  db: DBConfig,
  supabase: SupabaseConfig,
  gateway: GatewayConfig,
  gateway_secondary: GatewayConfig.optional(),
  kafka: KafkaConfig,
  gcp: GCPConfig,
  redis: RedisConfig,
});

type ServerEnvironmentConfig = z.infer<typeof ServerEnvironmentConfig>;

// This is the only environment configuration that is allowed to be server-only
// by doing this, we ensure these props do not make their way to the client and expose secrets
const serverOnlyEnvConfig = {
  db: { url: process.env.DATABASE_URL }, // Will replace supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  gateway: {
    url: process.env.STREAM_STATUS_ENDPOINT_URL,
    userId: process.env.STREAM_STATUS_ENDPOINT_USER,
    password: process.env.STREAM_STATUS_ENDPOINT_PASSWORD,
  },
  gateway_secondary: process.env.STREAM_STATUS_ENDPOINT_URL_SECONDARY
    ? {
        url: process.env.STREAM_STATUS_ENDPOINT_URL_SECONDARY,
        userId:
          process.env.STREAM_STATUS_ENDPOINT_USER_SECONDARY ||
          process.env.STREAM_STATUS_ENDPOINT_USER,
        password:
          process.env.STREAM_STATUS_ENDPOINT_PASSWORD_SECONDARY ||
          process.env.STREAM_STATUS_ENDPOINT_PASSWORD,
      }
    : undefined,
  kafka: {
    bootstrapServers: process.env.KAFKA_BOOTSTRAP_NODE,
    username: process.env.KAFKA_USER,
    password: process.env.KAFKA_PASSWORD,
  },
  gcp: {
    bucketName: process.env.GCP_BUCKET_NAME,
    credentials: process.env.GCP_CREDENTIALS,
  },
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
} as const;

const serverOnlyConfig = ServerEnvironmentConfig.parse(serverOnlyEnvConfig);

export const serverConfig = async () => serverOnlyConfig;

export const getGatewayConfig = (searchParams?: URLSearchParams) => {
  const useSecondary =
    !isProduction() && searchParams?.get("gateway") === "secondary";

  if (useSecondary && serverOnlyConfig.gateway_secondary) {
    return serverOnlyConfig.gateway_secondary;
  }

  return serverOnlyConfig.gateway;
};

export const validateServerEnv = async () => {
  try {
    ServerEnvironmentConfig.parse(serverOnlyConfig);
    console.log("Server environment configuration is valid");
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Invalid server environment configuration:");
      error.errors.forEach(err => {
        console.error(`- ${err.path.join(".")}: ${err.message}`);
      });
    }
    console.log("Server environment validation failed");
  }
};

export const gcpConfig = serverOnlyConfig.gcp;
