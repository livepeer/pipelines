"use server";

import { createServerClient } from "@repo/supabase";

const ERROR_MESSAGE =
  "Failed to delete pipeline. Please try again or check if you have the right access";

export async function deletePipeline(pipelineId: string, userId: string) {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("pipelines")
    .delete()
    .eq("id", pipelineId)
    .eq("author", userId);

  if (error) throw new Error(ERROR_MESSAGE);
  return;
}
