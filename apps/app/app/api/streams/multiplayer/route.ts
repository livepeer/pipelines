import { NextRequest, NextResponse } from "next/server";
import { getMultiplayerStream } from "./actions";

// Get the active stream info for the multiplayer stream
export async function GET() {
  const result = await getMultiplayerStream();
  return NextResponse.json(result.data, { status: result.status });
}
