import { NextResponse } from "next/server";
import { upsertStream } from "./upsert";
import { getAllStreams } from "./get-all";
import { z } from "zod";
import { deleteStream } from "./delete";

const ERROR_MESSAGES = {
  UNAUTHORIZED: "Authentication required",
  INVALID_INPUT: "Invalid stream configuration",
  INTERNAL_ERROR: "An unexpected error occurred",
} as const;

export async function POST(request: Request) {
  try {
    const userId = "did:privy:cm4x2cuiw007lh8fcj34919fu"; // Dummy user id (infra email)

    const body = await request.json().catch(() => null);
    if (!body) {
      return createErrorResponse(400, ERROR_MESSAGES.INVALID_INPUT);
    }

    const pipeline = await upsertStream(body, userId);
    return NextResponse.json(pipeline, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, error.issues);
    }
    const message =
      error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return createErrorResponse(500, message);
  }
}

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return createErrorResponse(401, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const streams = await getAllStreams(userId);

    return NextResponse.json(streams, { status: 200 });
  } catch (error) {
    return createErrorResponse(500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return createErrorResponse(401, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const streamId = new URL(request.url).searchParams.get("id");
    if (!streamId) {
      return createErrorResponse(400, "Stream ID is required");
    }

    const stream = await deleteStream(streamId);
    return NextResponse.json(stream, { status: 200 });
  } catch (error) {
    return createErrorResponse(500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
}

function createErrorResponse(status: number, message: unknown) {
  return NextResponse.json({ success: false, error: message }, { status });
}
