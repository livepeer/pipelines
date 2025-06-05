import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Config } from "../types/models";

declare module "fastify" {
  interface FastifyInstance {
    config: Config;
  }
}

const configPlugin: FastifyPluginAsync = async fastify => {
  // Load environment variables
  const serverPort = parseInt(process.env.PORT || "8080", 10);
  const promptMinDurationSecs = parseInt(
    process.env.PROMPT_MIN_DURATION_SECS || "10",
    10,
  );

  const streamKeys = (process.env.MULTIPLAYER_STREAM_KEY || "default-stream")
    .split(",")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const gatewayHosts = (process.env.GATEWAY_HOST || "")
    .split(",")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (!process.env.GATEWAY_HOST) {
    throw new Error("GATEWAY_HOST environment variable is required");
  }

  if (gatewayHosts.length !== streamKeys.length) {
    throw new Error(
      `Number of gateway hosts (${gatewayHosts.length}) must match number of stream keys (${streamKeys.length})`,
    );
  }

  const streamApiUser = process.env.STREAM_STATUS_ENDPOINT_USER;
  const streamApiPassword = process.env.STREAM_STATUS_ENDPOINT_PASSWORD;

  if (!streamApiUser) {
    throw new Error(
      "STREAM_STATUS_ENDPOINT_USER environment variable is required",
    );
  }

  if (!streamApiPassword) {
    throw new Error(
      "STREAM_STATUS_ENDPOINT_PASSWORD environment variable is required",
    );
  }

  const config: Config = {
    port: serverPort,
    prompt_min_duration_secs: promptMinDurationSecs,
    stream_keys: streamKeys,
    gateway_hosts: gatewayHosts,
    stream_api_user: streamApiUser,
    stream_api_password: streamApiPassword,
  };

  fastify.decorate("config", config);
  fastify.log.info("Configuration loaded", {
    serverPort,
    promptMinDurationSecs,
    streamKeys,
    gatewayHostsCount: gatewayHosts.length,
  });
};

export default fp(configPlugin, {
  name: "config",
});
