"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gcpConfig = exports.validateServerEnv = exports.getGatewayConfig = exports.serverConfig = exports.ServerEnvironmentConfig = void 0;
const zod_1 = require("zod");
const env_1 = require("./env");
const DBConfig = zod_1.z.object({
    url: zod_1.z.string().url(),
});
const SupabaseConfig = zod_1.z.object({
    url: zod_1.z.string().url().optional(),
    anonKey: zod_1.z.string().min(1).optional(),
    serviceRoleKey: zod_1.z.string().min(1).optional(),
});
const GatewayConfig = zod_1.z.object({
    url: zod_1.z.string().url().optional(),
    userId: zod_1.z.string().min(1).optional(),
    password: zod_1.z.string().min(1).optional(),
});
const KafkaConfig = zod_1.z.object({
    bootstrapServers: zod_1.z.string().min(1),
    username: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1),
});
const GCPConfig = zod_1.z.object({
    bucketName: zod_1.z.string().min(1).optional(),
    credentials: zod_1.z.string().optional(),
});
exports.ServerEnvironmentConfig = zod_1.z.object({
    db: DBConfig,
    supabase: SupabaseConfig,
    gateway: GatewayConfig,
    gateway_secondary: GatewayConfig.optional(),
    kafka: KafkaConfig,
    gcp: GCPConfig,
});
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
            userId: process.env.STREAM_STATUS_ENDPOINT_USER_SECONDARY ||
                process.env.STREAM_STATUS_ENDPOINT_USER,
            password: process.env.STREAM_STATUS_ENDPOINT_PASSWORD_SECONDARY ||
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
};
const serverOnlyConfig = exports.ServerEnvironmentConfig.parse(serverOnlyEnvConfig);
const serverConfig = async () => serverOnlyConfig;
exports.serverConfig = serverConfig;
const getGatewayConfig = (searchParams) => {
    const useSecondary = !(0, env_1.isProduction)() && searchParams?.get("gateway") === "secondary";
    if (useSecondary && serverOnlyConfig.gateway_secondary) {
        return serverOnlyConfig.gateway_secondary;
    }
    return serverOnlyConfig.gateway;
};
exports.getGatewayConfig = getGatewayConfig;
const validateServerEnv = async () => {
    try {
        exports.ServerEnvironmentConfig.parse(serverOnlyConfig);
        console.log("Server environment configuration is valid");
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            console.error("Invalid server environment configuration:");
            error.errors.forEach(err => {
                console.error(`- ${err.path.join(".")}: ${err.message}`);
            });
        }
        console.log("Server environment validation failed");
    }
};
exports.validateServerEnv = validateServerEnv;
exports.gcpConfig = serverOnlyConfig.gcp;
