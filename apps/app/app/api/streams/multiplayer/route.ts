import { NextResponse } from "next/server";
import { getUpdatedMultiplayerStream } from "./actions";

// Get the active stream info for the multiplayer stream with fallback
export async function GET() {
  const result = await getUpdatedMultiplayerStream();
  return NextResponse.json(result.data, { status: result.status });
}
