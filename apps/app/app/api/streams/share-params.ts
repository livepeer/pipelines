"use server";

import { createServerClient } from "@repo/supabase";
import { newId } from "@/lib/generate-id";

export async function createSharedParams(
  params: any,
  userId: string,
  pipelineId: string,
) {
  const supabase = await createServerClient();

  const crypto = require("crypto");
  const paramsString = JSON.stringify(params);
  const combinedString = `${paramsString}${pipelineId}`;
  const hash = crypto.createHash("sha256").update(combinedString).digest("hex");

  // Check if params with this hash already exist
  const { data: existingData, error: existingError } = await supabase
    .from("shared_params")
    .select()
    .eq("hash", hash)
    .single();

  if (existingData) {
    await supabase
      .from("shared_params")
      .update({ last_seen_at: new Date() })
      .eq("id", existingData.id);

    return { data: existingData, error: null };
  }

  const sharedId = newId("shared");

  const { data, error } = await supabase
    .from("shared_params")
    .insert({
      id: sharedId,
      params,
      author: userId,
      pipeline: pipelineId,
      hash,
      created_at: new Date(),
      last_seen_at: new Date(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating shared params:", error);
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

export async function getSharedParams(sharedId: string) {
  const supabase = await createServerClient();

  if (!sharedId || typeof sharedId !== "string") {
    console.error("Invalid shared ID:", sharedId);
    return { error: "Invalid shared ID format", data: null };
  }

  console.log("Fetching shared params for ID:", sharedId);

  const checkResult = await supabase
    .from("shared_params")
    .select("id")
    .eq("id", sharedId);

  if (checkResult.error) {
    console.error("Error checking shared params:", checkResult.error);
    return { error: checkResult.error.message, data: null };
  }

  if (!checkResult.data || checkResult.data.length === 0) {
    console.error("No shared params found with ID:", sharedId);
    return { error: "Shared configuration not found", data: null };
  }

  if (checkResult.data.length > 1) {
    console.error("Multiple shared params found with ID:", sharedId);
    return { error: "Multiple configurations found with this ID", data: null };
  }

  const { data, error } = await supabase
    .from("shared_params")
    .select("*, pipeline(*)")
    .eq("id", sharedId)
    .single();

  if (error) {
    console.error("Error fetching shared params:", error);
    return { error: error.message, data: null };
  }

  await supabase
    .from("shared_params")
    .update({ last_seen_at: new Date() })
    .eq("id", sharedId);

  return { data, error: null };
}

// New function specifically for tracking purposes
export async function getSharedParamsAuthor(sharedId: string) {
  if (!sharedId) {
    return { data: null, error: "Missing shared ID" };
  }

  try {
    const supabase = await createServerClient();

    // Only select the fields we need for tracking
    const { data, error } = await supabase
      .from("shared_params")
      .select("author, pipeline, created_at")
      .eq("id", sharedId)
      .single();

    if (error) {
      console.error("Error fetching shared params author:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Unexpected error in getSharedParamsAuthor:", error);
    return { data: null, error: "Server error" };
  }
}
