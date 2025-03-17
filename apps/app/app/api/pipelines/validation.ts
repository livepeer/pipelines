"use server";
import { upsertStream } from "../streams/upsert";
import { createServerClient } from "@repo/supabase/server";
import { getGatewayConfig, serverConfig } from "@/lib/serverEnv";
import { getAppConfig, isProduction } from "@/lib/env";

type StatusRequest = {
  headers: {
    Authorization: string;
  };
  url: string;
};

export type StreamStatus = {
  input_fps: number;
  last_error: any;
  last_error_time: any;
  last_input_time: number;
  last_output_time: any;
  last_params: any;
  last_params_hash: string;
  last_params_update_time: any;
  last_restart_logs: any;
  last_restart_time: number;
  orchestrator_info: OrchestratorInfo;
  output_fps: number;
  pipeline: string;
  pipeline_id: string;
  request_id: string;
  restart_count: number;
  start_time: number;
  stream_id: string;
  type: string;
  state: string;
};

export type OrchestratorInfo = {
  address: string;
  url: string;
};

const MAX_POLL_ATTEMPTS = 60;
const POLL_INTERVAL = 5000;

// Declare the map in the global scope since the pipelines and the streams api are running in different processes
declare global {
  var streamStatusMap: Map<string, any>;
}

if (!global.streamStatusMap) {
  global.streamStatusMap = new Map();
}

export async function createSmokeTestStream(pipelineId: string) {
  const supabase = await createServerClient();
  const { data: pipeline, error } = await supabase
    .from("pipelines")
    .select("*")
    .eq("id", pipelineId)
    .single();

  if (error) throw new Error(error.message);

  // Create a smoke test stream using the pipeline
  const { data: stream, error: streamError } = await upsertStream(
    {
      pipeline_id: pipeline.id,
      name: `${pipeline.name} - Smoke Test`,
      pipeline_params: pipeline.config?.inputs?.primary?.defaultValue || {},
      is_smoke_test: true,
      from_playground: false,
    },
    "did:privy:cm4x2cuiw007lh8fcj34919fu",
  ); // Using system user ID

  console.log("Stream created successfully:", stream);

  if (streamError) {
    console.error("Error creating smoke test stream:", streamError);
    throw new Error(streamError);
  }

  pollStreamStatus(stream);

  return stream;
}

export async function triggerSmokeTest(
  streamKey: string,
  searchParams?: URLSearchParams,
) {
  // Check if we're in the dev environment and skip triggering the smoke test if so - to not waste resources
  if (process.env.NEXT_PUBLIC_ENV === "dev") {
    console.log(
      "Skipping smoke test trigger in development environment (NEXT_PUBLIC_ENV=dev)",
    );
    return;
  }

  const useSecondaryGateway =
    !isProduction() && searchParams?.get("gateway") === "secondary";

  const gateway = getGatewayConfig(useSecondaryGateway);
  const gatewayUrl = gateway.url;
  const username = gateway.userId;
  const password = gateway.password;

  const currentApp = getAppConfig(useSecondaryGateway);
  const credentials = Buffer.from(`${username}:${password}`).toString("base64");
  const streamUrl = `${currentApp.rtmpUrl}${currentApp.rtmpUrl?.endsWith("/") ? "" : "/"}${streamKey}`;

  try {
    const response = await fetch(`${gatewayUrl}/smoketest`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        stream_url: streamUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error starting smoke test:", errorText);
      throw new Error(
        `Failed to start smoke test: ${response.status} ${errorText}`,
      );
    }
  } catch (error) {
    console.error("Error making smoke test API call:", error);
    throw error;
  }
}

export async function pollStreamStatus(
  stream: any,
  searchParams?: URLSearchParams,
) {
  const supabase = await createServerClient();
  const streamId = stream.id;
  const gateway = getGatewayConfig(
    !isProduction() && searchParams?.get("gateway") === "secondary",
  );
  const username = gateway.userId;
  const password = gateway.password;

  // Wait for gateway_host to be available
  const waitForGatewayHost = async () => {
    let retries = 0;
    const maxRetries = 10;

    while (retries < maxRetries) {
      const { data: s, error } = await supabase
        .from("streams")
        .select("*")
        .eq("id", streamId)
        .single();

      if (error) throw new Error(error.message);
      if (s.gateway_host) {
        return s;
      }

      console.log("Waiting for gateway_host to be available...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      retries++;
    }
    throw new Error("Timeout waiting for gateway_host");
  };

  stream = await waitForGatewayHost();

  const statusBaseUrl = `https://${stream.gateway_host}/live/video-to-video`;

  let request: StatusRequest = {
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
    },
    url: `${statusBaseUrl}/${streamId}/status`,
  };

  if (!request.url) throw new Error("Status base URL is undefined");

  let attempts = 0;

  try {
    while (attempts < MAX_POLL_ATTEMPTS) {
      try {
        await getAndStoreStreamStatus(request, streamId);
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        attempts++;
      } catch (error) {
        if (error instanceof Error && error.message.includes("404")) {
          // Stream status not available or not found
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
          attempts++;
          continue;
        }
        console.error("Polling error:", error);
        console.log(
          "Polling error::Stream status map:",
          global.streamStatusMap,
        );
        global.streamStatusMap.delete(streamId);
        break;
      }
    }

    if (attempts >= MAX_POLL_ATTEMPTS) {
      console.log("Max polling attempts reached");
      global.streamStatusMap.delete(streamId);
    }
  } catch (error) {
    console.error("Unexpected polling error:", error);
    global.streamStatusMap.delete(streamId);
  }
}

export async function getAndStoreStreamStatus(
  request: StatusRequest,
  streamId: string,
) {
  const response = await fetch(request.url, {
    headers: request.headers,
    method: "GET",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("404 Not Found");
    }
    throw new Error(`Failed to fetch stream status: ${response.statusText}`);
  }

  const data: StreamStatus = await response.json();
  console.log("getAndStoreStreamStatus::Stream status data:", data);
  console.log(
    "getAndStoreStreamStatus::Stream status map:",
    global.streamStatusMap,
  );
  global.streamStatusMap.set(streamId, data);

  return data;
}

export async function getStoredStreamStatus(
  streamId: string,
): Promise<any | undefined> {
  if (!global.streamStatusMap) {
    console.log("getStoredStreamStatus::Stream status map is undefined");
    return undefined;
  }
  return global.streamStatusMap.get(streamId);
}
