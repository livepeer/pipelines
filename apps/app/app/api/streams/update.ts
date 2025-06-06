"use server";

import { createServerClient } from "@repo/supabase";
import { z } from "zod";

const updateStreamSchema = z.object({
  name: z.string().optional(),
  whip_url: z.string().optional(),
  pipeline_params: z.record(z.any()).optional(),
  from_playground: z.boolean().optional(),
  gateway_host: z.string().optional(),
});

export type UpdateStreamRequest = z.infer<typeof updateStreamSchema>;

export async function updateStream(
  streamId: string,
  body: UpdateStreamRequest,
  userId: string,
) {
  const supabase = await createServerClient();

  const validationResult = updateStreamSchema.safeParse(body);
  if (!validationResult.success) {
    throw new z.ZodError(validationResult.error.errors);
  }

  const updateData = validationResult.data;

  // Verify ownership
  const { data: existingStream, error: fetchError } = await supabase
    .from("streams")
    .select("author")
    .eq("id", streamId)
    .single();

  if (fetchError) {
    return { data: null, error: "Stream not found" };
  }

  if (existingStream.author !== userId) {
    return { data: null, error: "Unauthorized to update this stream" };
  }

  // Update stream
  const { data: updatedStream, error: updateError } = await supabase
    .from("streams")
    .update(updateData)
    .eq("id", streamId)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating stream:", updateError);
    return { data: null, error: updateError?.message };
  }

  return { data: updatedStream, error: null };
}
