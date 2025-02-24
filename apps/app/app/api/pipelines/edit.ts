"use server";
import { isPipelineOwner, validateUser } from "@/app/api/pipelines/auth";
import { uploadFile } from "@/app/api/pipelines/storage";
import { pipelineSchema } from "@/lib/types";
import { createServerClient } from "@repo/supabase/server";
import { z } from "zod";
import { triggerSmokeTest } from "./validation";
import { createSmokeTestStream } from "./validation";
import { generateComfyConfig } from "./create";
export async function publishPipeline(pipelineId: string, userId: string) {
  const supabase = await createServerClient();

  await validateUser(userId);

  const { data: updatedPipeline, error: updateError } = await supabase
    .from("pipelines")
    .upsert({
      id: pipelineId,
      is_private: false,
    })
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);

  return { pipeline: updatedPipeline };
}

export async function updatePipeline(body: any, userId: string) {
  const supabase = await createServerClient();

  await validateUser(userId);

  const validationResult = pipelineSchema.safeParse(body);

  if (!validationResult.success) {
    throw new z.ZodError(validationResult.error.errors);
  }
  const pipelineId = body.id;
  const { data: pipeline, error } = await supabase
    .from("pipelines")
    .update(validationResult.data)
    .eq("id", pipelineId)
    .eq("author", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Create a smoke test stream using the pipeline for pre-publication validation with new config saved
  const smokeTestStream = await createSmokeTestStream(pipelineId);
  await triggerSmokeTest(smokeTestStream.stream_key);

  return { pipeline, smokeTestStream };
}

export async function editPipelineFromFormData(
  formData: FormData,
  userId: string,
) {
  const formDataObject = Object.fromEntries(formData.entries());
  const pipelineId = formDataObject.id as string;

  await isPipelineOwner(userId, pipelineId);

  // Upload the cover_image file
  const coverImageFile = formDataObject.cover_image as File;
  const imageUrl = await uploadFile({
    file: coverImageFile,
    bucket: "pipelines",
    fileName: `${userId}/${pipelineId}-cover_image`,
    operation: "edit",
  });

  // Parse the comfy_ui_json text data as JSON
  const comfyUiJson = JSON.parse(formDataObject.comfy_json as string);

  const prioritizedParams = formDataObject.prioritized_params
    ? Array.isArray(formDataObject.prioritized_params)
      ? formDataObject.prioritized_params
      : JSON.parse(formDataObject.prioritized_params as string)
    : null;

  const comfyUiConfig = await generateComfyConfig(
    comfyUiJson,
    formDataObject.version as string,
    formDataObject.description as string,
  );

  const pipelineData = {
    ...formDataObject,
    cover_image: imageUrl,
    author: userId,
    id: pipelineId,
    config: comfyUiConfig,
    prioritized_params: prioritizedParams,
  };

  const { pipeline, smokeTestStream } = await updatePipeline(
    pipelineData,
    userId,
  );
  return { pipeline, smokeTestStream };
}
