import { NextResponse } from "next/server";
import { upsertStream } from "./upsert";
import { getAllStreams } from "./get-all";
import { z } from "zod";
import { deleteStream } from "./delete";
import { getPrivyUser } from "@/lib/auth";

const ERROR_MESSAGES = {
  UNAUTHORIZED: "Authentication required",
  INVALID_INPUT: "Invalid stream configuration",
  INTERNAL_ERROR: "An unexpected error occurred",
} as const;

// TODO: Remove this once everything is tested and works as expected.
const DUMMY_USER_ID = "did:privy:cm4x2cuiw007lh8fcj34919fu";

export async function POST(request: Request) {
  try {
    const user = await getPrivyUser();
    if (!user) {
      return createErrorResponse(401, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return createErrorResponse(400, ERROR_MESSAGES.INVALID_INPUT);
    }

    const pipeline = await upsertStream(body, user.userId);
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
    const user = await getPrivyUser();
    if (!user) {
      return createErrorResponse(401, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const streams = await getAllStreams(user.userId);
    return NextResponse.json(streams, { status: 200 });
  } catch (error) {
    return createErrorResponse(500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getPrivyUser();
    if (!user) {
      return createErrorResponse(401, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.streamId) {
      return createErrorResponse(400, "Stream ID is required in request body");
    }

    const stream = await deleteStream(body.streamId);
    return NextResponse.json(stream, { status: 200 });
  } catch (error) {
    return createErrorResponse(500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
}

function createErrorResponse(status: number, message: unknown) {
  return NextResponse.json({ success: false, error: message }, { status });
}
