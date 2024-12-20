import { z } from "zod";

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

const ServerEnvironmentConfig = z.object({
  supabase: SupabaseConfig,
  gateway: GatewayConfig,
});

type ServerEnvironmentConfig = z.infer<typeof ServerEnvironmentConfig>;

// This is the only environment configuration that is allowed to be server-only
// by doing this, we ensure these props do not make their way to the client and expose secrets
const serverOnlyEnvConfig = {
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  gateway: {
    url: process.env.STREAM_STATUS_ENDPOINT_URL,
    userId: process.env.STREAM_STATUS_ENDPOINT_USER,
    password: process.env.STREAM_STATUS_ENDPOINT_PASSWORD,
  }
} as const;

const serverOnlyConfig = ServerEnvironmentConfig.parse(serverOnlyEnvConfig);

export const serverConfig = async () => serverOnlyConfig;

export const validateServerEnv = async () => {
  try {
    ServerEnvironmentConfig.parse(serverOnlyConfig);
    console.log("Server environment configuration is valid");
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Invalid server environment configuration:");
      error.errors.forEach((err) => {
        console.error(`- ${err.path.join(".")}: ${err.message}`);
      });
    }
    console.log("Server environment validation failed");
  }
};
