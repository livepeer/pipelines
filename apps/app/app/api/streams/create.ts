"use server";

import { createServerClient } from "@repo/supabase";
import { z } from "zod";
import { newId } from "@/lib/generate-id";
import { livepeer as livePeerEnv } from "@/lib/env";
import { livepeerSDK } from "@/lib/core";
import { getAppConfig } from "@/lib/env";
import { getPipeline } from "../pipelines/get";

const createDefaultValues = (pipeline: any) => {
  const inputs = pipeline.config.inputs;
  const primaryInput = inputs.primary;
  const advancedInputs = inputs.advanced;
  const allInputs = [primaryInput, ...advancedInputs];
  return allInputs.reduce((acc, input) => {
    acc[input.id] = input.defaultValue;
    return acc;
  }, {});
};

const processInputValues = (inputValues: any) => {
  return Object.fromEntries(
    Object.entries(inputValues).map(([key, value]) => {
      try {
        return [key, JSON.parse(value as string)];
      } catch {
        return [key, value];
      }
    }),
  );
};

const createStreamSchema = z.object({
  pipeline_id: z.string(),
  pipeline_params: z.record(z.any()).optional().default({}),
  name: z.string().optional(),
  from_playground: z.boolean().optional(),
  is_smoke_test: z.boolean().default(false),
});

export type CreateStreamRequest = z.infer<typeof createStreamSchema>;

const getStreamUrl = (
  streamKey: string,
  searchParams?: URLSearchParams,
): string => {
  const customWhipServer = searchParams?.get("whipServer");
  const customOrchestrator = searchParams?.get("orchestrator");

  const app = getAppConfig(searchParams);

  if (customWhipServer) {
    if (customWhipServer.includes("<STREAM_KEY>")) {
      return addOrchestratorParam(
        customWhipServer.replace("<STREAM_KEY>", streamKey),
        customOrchestrator ?? null,
      );
    }
    return addOrchestratorParam(
      `${customWhipServer}${streamKey}/whip`,
      customOrchestrator ?? null,
    );
  }

  return addOrchestratorParam(
    `${app.newWhipUrl}${streamKey}/whip`,
    customOrchestrator ?? null,
  );
};

const addOrchestratorParam = (
  url: string,
  orchestrator: string | null,
): string => {
  if (orchestrator) {
    const urlObj = new URL(url);
    urlObj.searchParams.set("orchestrator", orchestrator);
    return urlObj.toString();
  }
  return url;
};

export async function createStream(
  body: CreateStreamRequest,
  userId: string,
  searchParams?: URLSearchParams,
) {
  const supabase = await createServerClient();

  const validationResult = createStreamSchema.safeParse(body);
  if (!validationResult.success) {
    throw new z.ZodError(validationResult.error.errors);
  }

  const streamData = validationResult.data;
  const streamId = newId("stream");
  const streamKey = newId("stream_key");

  const pipeline = await getPipeline(streamData.pipeline_id);
  const inputValues = createDefaultValues(pipeline);
  const processedInputValues = processInputValues(inputValues);

  // Create Livepeer stream
  let livepeerStream;
  const result = await createLivepeerStream(streamData.name);
  if (result.error) {
    console.error(
      "Error creating livepeer stream. Perhaps the Livepeer Studio API Key is not configured?",
      result.error,
    );
  } else {
    livepeerStream = result.stream;
  }

  // Generate WHIP URL server-side
  const whipUrl = getStreamUrl(streamKey, searchParams);

  // Create stream payload with all necessary data
  const streamPayload = {
    id: streamId,
    name: streamData.name || `Stream ${streamId}`,
    output_playback_id: livepeerStream?.playbackId || "",
    output_stream_url: livepeerStream?.streamKey
      ? `${livePeerEnv.rtmpUrl}${livepeerStream?.streamKey}`
      : "",
    whip_url: whipUrl,
    stream_key: streamKey,
    pipeline_params: processedInputValues,
    pipeline_id: streamData.pipeline_id,
    author: userId,
    from_playground: streamData.from_playground,
    is_smoke_test: streamData.is_smoke_test,
    created_at: new Date(),
  };

  const { data: createdStream, error: streamError } = await supabase
    .from("streams")
    .insert([streamPayload])
    .select()
    .single();

  if (streamError) {
    console.error("Error creating stream:", streamError);
    return { data: null, error: streamError?.message };
  }

  return { data: createdStream, error: null };
}

const createLivepeerStream = async (name?: string) => {
  try {
    const { stream, error } = await livepeerSDK.stream.create({
      name: name || "stream",
    });

    return { stream, error };
  } catch (e: any) {
    console.error("Error creating livepeer stream:", e);
    return { stream: null, error: e.message };
  }
};
