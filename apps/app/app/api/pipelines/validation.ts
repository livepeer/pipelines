import { upsertStream } from "../streams/upsert";
import { createServerClient } from "@repo/supabase";
import { serverConfig } from "@/lib/serverEnv";
import { app } from "@/lib/env";

export async function createSmokeTestStream(pipelineId: string) {
  const supabase = await createServerClient();
  const { data: pipeline, error } = await supabase
    .from("pipelines")
    .select("*")
    .eq("id", pipelineId)
    .single();
    
  if (error) throw new Error(error.message);

  // Create a smoke test stream using the pipeline
  const { data: stream, error: streamError } = await upsertStream({
    pipeline_id: pipeline.id,
    name: `${pipeline.name} - Smoke Test`,
    pipeline_params: pipeline.config?.inputs?.primary?.defaultValue || {},
    is_smoke_test: true,
    from_playground: false
  }, "did:privy:cm4x2cuiw007lh8fcj34919fu"); // Using system user ID

  if (streamError) {
    console.error("Error creating smoke test stream:", streamError);
    throw new Error(streamError);
  }

  return stream;
}

export async function triggerSmokeTest(streamKey: string) {
  const { gateway } = await serverConfig();
  const gatewayUrl = gateway.url;
  const username = gateway.userId;
  const password = gateway.password;

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");
  
  const streamUrl = `${app.rtmpUrl}${app.rtmpUrl?.endsWith('/') ? '' : '/'}${streamKey}`;

  console.log("Triggering smoke test for stream:", streamUrl);
  console.log("Gateway URL:", gatewayUrl);

  try {
    const response = await fetch(`${gatewayUrl}/smoketest`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({
        stream_url: streamUrl,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error starting smoke test:", errorText);
      throw new Error(`Failed to start smoke test: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error("Error making smoke test API call:", error);
    throw error;
  }
}
