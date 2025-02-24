"use server";

import { createServerClient } from "@repo/supabase";

export async function getAllStreams(userId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("streams")
    .select("*")
    .eq("author", userId);

  if (error) throw new Error(error.message);

  return data;
}
