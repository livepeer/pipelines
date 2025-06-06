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
    stream_api_user: streamApiUser,
    stream_api_password: streamApiPassword,
  };

  fastify.decorate("config", config);
  fastify.log.info("Configuration loaded", {
    serverPort,
    promptMinDurationSecs,
  });
};

export default fp(configPlugin, {
  name: "config",
});
