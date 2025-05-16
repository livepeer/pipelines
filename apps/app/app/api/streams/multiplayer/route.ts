import { NextResponse } from "next/server";
import { getUpdatedMultiplayerStream } from "./actions";

// Get the active stream info for the multiplayer stream
export async function GET() {
  console.log("multiplayer stream route:: GET");
  const result = await getUpdatedMultiplayerStream();
  console.log("multiplayer stream route:: result", result);
  return NextResponse.json(result.data, { status: result.status });
}
