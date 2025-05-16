"use server";

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { streams as streamsTable } from "@/lib/db/schema";
import { MULTIPLAYER_FALLBACK_STREAMS } from "@/lib/utils";
import { getStreamStatus } from "../[id]/status/actions";

const FALLBACK_STREAMS = MULTIPLAYER_FALLBACK_STREAMS;

let activeStreamIndex = 0;

// Server action function to get the updated multiplayer stream
export async function getUpdatedMultiplayerStream() {
  const stream = FALLBACK_STREAMS[activeStreamIndex];
  const currentStreamKey = stream.streamKey;

  // 1. Get the stream info based on streamKey
  const streamInfo = await db
    .select()
    .from(streamsTable)
    .where(eq(streamsTable.streamKey, currentStreamKey))
    .limit(1);

  if (streamInfo.length === 0) {
    activeStreamIndex = (activeStreamIndex + 1) % FALLBACK_STREAMS.length;
    return {
      data: FALLBACK_STREAMS[activeStreamIndex],
      status: 200,
    };
  }

  // 2. Fetch status of the stream
  const { error, data: statusData } = await getStreamStatus(streamInfo[0].id);

  // 3. If error, round robin to the next stream.
  if (error || statusData.state !== "ONLINE") {
    activeStreamIndex = (activeStreamIndex + 1) % FALLBACK_STREAMS.length;
    return {
      data: FALLBACK_STREAMS[activeStreamIndex],
      status: 200,
    };
  }

  // 4. Return the stream info
  return {
    data: FALLBACK_STREAMS[activeStreamIndex],
    status: 200,
  };
}

// Server action function to get the active multiplayer stream
export async function getMultiplayerStream() {
  return {
    data: FALLBACK_STREAMS[activeStreamIndex],
    status: 200,
  };
}
