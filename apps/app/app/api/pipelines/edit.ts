"use server";
import { isPipelineOwner, validateUser } from "@/app/api/pipelines/auth";
import { uploadFile } from "@/app/api/pipelines/storage";
import { pipelineSchema } from "@/lib/types";
import { createServerClient } from "@repo/supabase/server";
import { z } from "zod";

export async function updatePipeline(body: any, userId: string) {
  const supabase = await createServerClient();

  await validateUser(userId);

  const validationResult = pipelineSchema.safeParse(body);

  if (!validationResult.success) {
    throw new z.ZodError(validationResult.error.errors);
  }

  const { data, error } = await supabase
    .from("pipelines")
    .update(validationResult.data)
    .eq("id", body.id)
    .eq("author", userId)
    .select();

  if (error) throw new Error(error.message);
  return data;
}

export async function editPipelineFromFormData(
  formData: FormData,
  userId: string
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

  const pipelineData = {
    ...formDataObject,
    cover_image: imageUrl,
    author: userId,
    id: pipelineId,
    config: comfyUiJson,
  };

  const pipeline = await updatePipeline(pipelineData, userId);
  return pipeline;
}
