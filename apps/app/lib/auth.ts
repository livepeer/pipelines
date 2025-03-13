"use server";

import { createServerClient } from "@repo/supabase/server";
import { compareSync } from "bcrypt-edge";

/**
 * Validates an API key and returns the associated user ID if valid
 * @param apiKey The API key to validate
 * @returns An object containing the userId (if valid) and whether the key is valid
 */
export async function validateApiKey(apiKey: string | null) {
  if (!apiKey) {
    return { userId: null, valid: false };
  }

  const supabase = await createServerClient();
  
  const { data: apiKeyRecords, error } = await supabase
    .from("api_keys")
    .select("user_id, api_key")
    .eq("is_active", true);
    
  if (error || apiKeyRecords.length === 0) {
    return { userId: null, valid: false };
  }
  
  let isValid = false;
  let userId = null;
  
  for (const keyRecord of apiKeyRecords) {
    isValid = compareSync(apiKey, keyRecord.api_key);
    if (isValid) {
      userId = keyRecord.user_id;
      break;
    }
  }
  
  return { userId, valid: isValid };
}

/**
 * Extracts and validates API key from Authorization header
 * @param request The request object containing headers
 * @returns The user ID if valid API key was provided, null otherwise
 */
export async function getUserFromApiKey(request: Request) {
  const authHeader = request.headers.get("Authorization");
  let apiKey = null;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    apiKey = authHeader.substring(7);
  }
  
  if (!apiKey) {
    return null;
  }
  
  const { userId, valid } = await validateApiKey(apiKey);
  
  return valid ? userId : null;
} 