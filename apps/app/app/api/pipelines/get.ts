"use server";

import { createServerClient } from "@repo/supabase";

export async function getAllPipelines() {
  const supabase = await createServerClient();

  // Get all pipelines which are not private
  const { data, error } = await supabase
    .from("pipelines")
    .select("*, author:users(name)")
    .eq("is_private", false);

  if (error) throw new Error(error.message);
  return data;
}

// TODO: Add pagination
export async function getPipelinesByUser(userId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("pipelines")
    .select("*")
    .eq("author", userId);

  if (error) throw new Error(error.message);
  return data;
}

export async function getPipeline(pipelineId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("pipelines")
    .select("*")
    .eq("id", pipelineId)
    .single();
  if (error) throw new Error(error.message);

  return data;
}
