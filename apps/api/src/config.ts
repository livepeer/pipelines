import * as dotenv from "dotenv";
import { Config } from "./types";

dotenv.config();

export class ConfigManager {
  private static instance: Config | null = null;

  public static fromEnv(): Config {
    if (this.instance) {
      return this.instance;
    }

    const redis_url = process.env.REDIS_URL || "redis://localhost:6379";

    const server_port = parseInt(process.env.SERVER_PORT || "8080", 10);
    if (isNaN(server_port)) {
      throw new Error("Failed to parse SERVER_PORT");
    }

    const prompt_min_duration_secs = parseInt(
      process.env.PROMPT_MIN_DURATION_SECS || "10",
      10,
    );
    if (isNaN(prompt_min_duration_secs)) {
      throw new Error("Failed to parse PROMPT_MIN_DURATION_SECS");
    }

    const stream_keys = (process.env.MULTIPLAYER_STREAM_KEY || "default-stream")
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const gateway_hosts_env = process.env.GATEWAY_HOST;
    if (!gateway_hosts_env) {
      throw new Error("GATEWAY_HOST environment variable is required");
    }

    const gateway_hosts = gateway_hosts_env
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (gateway_hosts.length !== stream_keys.length) {
      throw new Error(
        `Number of gateway hosts (${gateway_hosts.length}) must match number of stream keys (${stream_keys.length})`,
      );
    }

    const stream_api_user = process.env.STREAM_STATUS_ENDPOINT_USER;
    if (!stream_api_user) {
      throw new Error(
        "STREAM_STATUS_ENDPOINT_USER environment variable is required",
      );
    }

    const stream_api_password = process.env.STREAM_STATUS_ENDPOINT_PASSWORD;
    if (!stream_api_password) {
      throw new Error(
        "STREAM_STATUS_ENDPOINT_PASSWORD environment variable is required",
      );
    }

    this.instance = {
      redis_url,
      server_port,
      prompt_min_duration_secs,
      stream_keys,
      gateway_hosts,
      stream_api_user,
      stream_api_password,
    };

    return this.instance;
  }
}
