import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getStreamStatus } from "./actions";

// Route handler (uses the server action function)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const streamId = (await params).id;
  const result = await getStreamStatus(streamId, request.nextUrl.searchParams);

  return NextResponse.json(
    { success: result.success, error: result.error, data: result.data },
    { status: result.status },
  );
}
