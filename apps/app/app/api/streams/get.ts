"use server";

import { livepeerSDK } from "@/lib/core";
import { createServerClient } from "@repo/supabase";

export async function getStream(streamId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("streams")
    .select(
      `
      id,
      name,
      stream_key,
      output_stream_url,
      pipeline_params,
      created_at,
      pipeline_id,
      output_playback_id,
      author,
      gateway_host,
      pipelines!inner (
        id,
        name,
        type,
        config
      )
    `,
    )
    .eq("id", streamId)
    .single();
  return { data, error: error?.message };
}

export async function getStreams(
  userId: string,
  page: number = 1,
  limit: number = 10,
) {
  const supabase = await createServerClient();
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .from("streams")
    .select(
      `
        id,
        name,
        stream_key,
        output_stream_url,
        pipeline_params,
        created_at,
        pipeline_id,
        output_playback_id,
        from_playground,
        gateway_host,
        pipelines!inner (
          id,
          type,
          name
        )
      `,
    )
    .eq("author", userId)
    .eq("from_playground", false)
    .eq("is_smoke_test", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching Streams:", error);
    throw new Error("Could not fetch Streams");
  }

  const totalCountQuery = await supabase
    .from("streams")
    .select("*", { count: "exact", head: true })
    .eq("author", userId);

  if (totalCountQuery.error) {
    console.error("Error fetching total count:", totalCountQuery.error);
    throw new Error("Could not fetch total count");
  }

  const total = totalCountQuery.count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    totalPages,
  };
}

export async function getStreamPlaybackInfo(playbackId: string) {
  try {
    const response = await livepeerSDK.playback.get(playbackId);
    return { data: response.playbackInfo, error: null };
  } catch (error) {
    console.error("Error fetching playback info:", error);
    return { data: null, error: error };
  }
}
