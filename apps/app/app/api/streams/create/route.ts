import { NextResponse } from "next/server";
import { Livepeer } from "livepeer";
import { livepeer as livePeerEnv } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const livepeerSDK = new Livepeer({
      serverURL: livePeerEnv.apiUrl,
      apiKey: livePeerEnv.apiKey,
    });

    const { name } = await request.json();

    const { stream, error } = await livepeerSDK.stream.create({
      name: name || "stream",
    });

    if (error || !stream) {
      throw new Error(typeof error === 'string' ? error : 'Failed to create stream');
    }

    return NextResponse.json({
      streamId: stream.id,
      ingestUrl: `${livePeerEnv.rtmpUrl}${stream.streamKey}`,
      playbackId: stream.playbackId,
    });
  } catch (error) {
    console.error('Error creating stream:', error);
    return NextResponse.json(
      { error: 'Failed to create stream' },
      { status: 500 }
    );
  }
} 