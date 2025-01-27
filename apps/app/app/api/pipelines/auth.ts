"use server";

import { createServerClient } from "@repo/supabase/server";
import { NextResponse } from "next/server";

function createErrorResponse(status: number, message: unknown) {
  return NextResponse.json({ success: false, error: message }, { status });
}

const ERROR_MESSAGES = {
  UNAUTHORIZED: "Authentication required or invalid user",
  INVALID_INPUT: "Invalid pipeline configuration",
  INTERNAL_ERROR: "An unexpected error occurred",
} as const;

export async function validateUser(userId: string) {
  const supabase = await createServerClient();
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId);

  if (userError || !user) {
    return createErrorResponse(401, ERROR_MESSAGES.UNAUTHORIZED);
  }
  return user;
}
