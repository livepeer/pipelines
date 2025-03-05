"use server";

import { createServerClient } from "@repo/supabase";
import { livepeerSDK } from "@/lib/core";

export async function deleteStream(streamId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("streams")
    .delete()
    .eq("id", streamId);
  if (!error) {
    deleteLivepeerStream(streamId);
  }
  return { data, error: error?.message };
}

export const deleteLivepeerStream = async (name: string) => {
  try {
    const { error } = await livepeerSDK.stream.delete(name);

    return { error };
  } catch (e: any) {
    console.error("Error deleting livepeer stream:", e);
    return { stream: null, error: e.message };
  }
};
