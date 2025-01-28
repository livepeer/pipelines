"use server";

import { validateUser } from "@/app/api/pipelines/auth";
import { uploadFile } from "@/app/api/pipelines/storage";
import { newId } from "@/lib/generate-id";
import { pipelineSchema } from "@/lib/types";
import { createServerClient } from "@repo/supabase";
import { z } from "zod";
import { createSmokeTestStream, triggerSmokeTest } from "./validation";

export async function createPipeline(
  body: any,
  userId: string,
  pipelineId?: string
) {
  const supabase = await createServerClient();

  await validateUser(userId);

  const validationResult = pipelineSchema.safeParse(body);

  if (!validationResult.success) {
    throw new z.ZodError(validationResult.error.errors);
  }

  const id = pipelineId || newId("pipeline");

  const { data, error } = await supabase
    .from("pipelines")
    .insert({ ...validationResult.data, id })
    .select();

  if (error) throw new Error(error.message);

  // Create a smoke test stream using the pipeline for pre-publication validation
  const smokeTestStream = await createSmokeTestStream(id)
  await triggerSmokeTest(smokeTestStream.stream_key);

  return data[0];
}

export async function createPipelineFromFormData(
  formData: FormData,
  userId: string
) {
  const formDataObject = Object.fromEntries(formData.entries());
  const pipelineId = newId("pipeline");

  // Upload the cover_image file
  const coverImageFile = formDataObject.cover_image as File;
  const imageUrl = await uploadFile({
    file: coverImageFile,
    bucket: "pipelines",
    fileName: `${userId}/${pipelineId}-cover_image`,
    operation: "create",
  });

  // Parse the comfy_ui_json file data as JSON
  const comfyUiFile = formDataObject.comfy_json as File;
  const comfyUiJson = JSON.parse(await comfyUiFile.text());

  const pipelineData = {
    ...formDataObject,
    cover_image: imageUrl,
    author: userId,
    id: pipelineId,
    config: comfyUiJson,
  };

  const pipeline = await createPipeline(pipelineData, userId);
  return pipeline;
}
