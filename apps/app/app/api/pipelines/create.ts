"use server";

import { validateUser } from "@/app/api/pipelines/auth";
import { uploadFile } from "@/app/api/pipelines/storage";
import { newId } from "@/lib/generate-id";
import { pipelineSchema } from "@/lib/types";
import { createServerClient } from "@repo/supabase";
import { z } from "zod";

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

  const { data, error } = await supabase
    .from("pipelines")
    .insert({ ...validationResult.data, id: pipelineId || newId("pipeline") })
    .select();

  if (error) throw new Error(error.message);
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

  const comfyUiConfig = generateComfyConfig(
    comfyUiJson,
    formDataObject.version as string,
    formDataObject.description as string
  );

  const pipelineData = {
    ...formDataObject,
    cover_image: imageUrl,
    author: userId,
    id: pipelineId,
    config: comfyUiConfig,
  };

  const pipeline = await createPipeline(pipelineData, userId);
  return pipeline;
}

export async function generateComfyConfig(config: any, version?: string, description?: string) {
  return {
    inputs: {
      primary: {
        id: "prompt",
        type: "textarea",
        label: "Comfy UI JSON",
        required: true,
        fullWidth: true,
        placeholder: "Enter json object",
        defaultValue: config
      },
      advanced: []
    },
    version: version || "0.0.1",
    metadata: {
      description: description || ""
    }
  };
}