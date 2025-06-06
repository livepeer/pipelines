import { NextResponse } from "next/server";
import { updateStream } from "../update";
import { z } from "zod";

const ERROR_MESSAGES = {
  UNAUTHORIZED: "Authentication required",
  INVALID_INPUT: "Invalid stream configuration",
  INTERNAL_ERROR: "An unexpected error occurred",
  NOT_FOUND: "Stream not found",
} as const;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return createErrorResponse(401, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const streamId = params.id;
    if (!streamId) {
      return createErrorResponse(400, "Stream ID is required");
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return createErrorResponse(400, ERROR_MESSAGES.INVALID_INPUT);
    }

    const result = await updateStream(streamId, body, userId);

    if (result.error) {
      const status =
        result.error === "Stream not found"
          ? 404
          : result.error === "Unauthorized to update this stream"
            ? 403
            : 500;
      return createErrorResponse(status, result.error);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, error.issues);
    }
    const message =
      error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return createErrorResponse(500, message);
  }
}

function createErrorResponse(status: number, message: unknown) {
  return NextResponse.json({ success: false, error: message }, { status });
}
