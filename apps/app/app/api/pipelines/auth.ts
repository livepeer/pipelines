"use server";

import { createServerClient } from "@repo/supabase/server";
import { NextResponse } from "next/server";

const ERROR_MESSAGES = {
  UNAUTHORIZED: "Authentication required or invalid user",
  INVALID_INPUT: "Invalid pipeline configuration",
  INTERNAL_ERROR: "An unexpected error occurred",
  NOT_OWNER: "You do not have permission to view this pipeline",
} as const;

export async function validateUser(userId: string) {
  const supabase = await createServerClient();
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId);

  if (userError || !user) {
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }
  return user;
}

export async function isPipelineOwner(userId: string, pipelineId: string) {
  const supabase = await createServerClient();
  const { data: pipeline, error } = await supabase
    .from("pipelines")
    .select("*")
    .eq("id", pipelineId)
    .eq("author", userId)
    .single();

  if (error || !pipeline) {
    throw new Error(ERROR_MESSAGES.NOT_OWNER);
  }
  return true;
}
