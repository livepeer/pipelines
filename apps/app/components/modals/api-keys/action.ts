"use server";

import { createServerClient } from "@repo/supabase";
import crypto from "crypto";
import { hashSync } from "bcrypt-edge";
import { newId } from "@/lib/generate-id";

export async function createAPIKey(
  apiKeyName: string,
  userId: string | undefined,
) {
  const supabase = await createServerClient();

  if (!apiKeyName || !userId) {
    return;
  }

  const apiKey = newId("api_key");

  const hashedApiKey = await hashSync(apiKey, 10);

  const { data, error } = await supabase.from("api_keys").insert({
    name: apiKeyName,
    api_key: hashedApiKey,
    user_id: userId,
  });

  if (error) {
    console.error("Error storing API key:", error);
    throw new Error("Could not store API key");
  }

  return apiKey;
}

export async function getAPIKeys(userId: string | undefined) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching API keys:", error);
    throw new Error("Could not fetch API keys");
  }

  return data;
}
