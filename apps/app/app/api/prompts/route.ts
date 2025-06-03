import { NextRequest, NextResponse } from "next/server";
import { getPromptState, addToPromptQueue, addRandomPrompt } from "./store";
import {
  isPromptNSFW as isPromptNSFW,
  getRandomSafePrompt,
} from "@/lib/nsfwCheck";
import { getPrivyUser } from "@/lib/auth";

const ERROR_MESSAGES = {
  UNAUTHORIZED: "Authentication required",
  INVALID_INPUT: "Invalid request parameters",
  INTERNAL_ERROR: "An unexpected error occurred",
  QUEUE_FULL: "Queue is full, try again later",
} as const;

const ALLOWED_HOSTS = JSON.parse(
  process.env.MULTIPLAYER_PROMPT_ENDPOINT_WHITELIST ?? "[]",
);

function createErrorResponse(status: number, message: unknown) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function isAllowedHost(request: NextRequest) {
  const requestHost = request.headers.get("host");
  const serverHost = process.env.VERCEL_ENV;
  console.log("requestHost", requestHost);
  console.log("serverHost", serverHost);
  console.log("ALLOWED_HOSTS", ALLOWED_HOSTS);
  return serverHost
    ? [...ALLOWED_HOSTS, serverHost].includes(requestHost ?? "")
    : ALLOWED_HOSTS.includes(requestHost ?? "");
}

export async function GET(request: NextRequest) {
  try {
    if (!isAllowedHost(request)) {
      const user = await getPrivyUser();
      if (!user) {
        return createErrorResponse(401, ERROR_MESSAGES.UNAUTHORIZED);
      }
    }

    const searchParams = request.nextUrl.searchParams;
    const streamKey = searchParams.get("streamKey");

    if (!streamKey) {
      return createErrorResponse(400, "Missing streamKey parameter");
    }

    const promptState = await getPromptState(streamKey);
    return NextResponse.json(promptState);
  } catch (error) {
    console.error("Error getting prompt state:", error);
    return createErrorResponse(500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAllowedHost(request)) {
      const user = await getPrivyUser();
      if (!user) {
        return createErrorResponse(401, ERROR_MESSAGES.UNAUTHORIZED);
      }
    }

    const body = await request.json();
    const { prompt, text, seed, isUser, sessionId, streamKey } = body;

    const promptText = prompt || text;

    if (!promptText || typeof promptText !== "string") {
      return createErrorResponse(
        400,
        "Missing or invalid prompt/text in request body",
      );
    }

    if (!seed || typeof seed !== "string") {
      return createErrorResponse(
        400,
        "Missing or invalid 'seed' in request body",
      );
    }

    if (!streamKey || typeof streamKey !== "string") {
      return createErrorResponse(
        400,
        "Missing or invalid 'streamKey' in request body",
      );
    }

    const validatedIsUser = typeof isUser === "boolean" ? isUser : false;

    // Check if the prompt is attempting to generate NSFW content
    let finalPrompt = promptText;
    let wasCensored = false;
    let censorExplanation = "";

    if (validatedIsUser) {
      const nsfwCheck = await isPromptNSFW(promptText);

      if (nsfwCheck.isNSFW) {
        // Replace with a safe prompt
        finalPrompt = getRandomSafePrompt();
        wasCensored = true;
        censorExplanation = nsfwCheck.explanation;
        console.log(`Censored prompt: "${promptText}" - ${censorExplanation}`);
      }
    }

    const result = await addToPromptQueue(
      finalPrompt,
      seed,
      validatedIsUser,
      sessionId,
      streamKey,
    );

    if (!result.success) {
      return createErrorResponse(429, ERROR_MESSAGES.QUEUE_FULL);
    }

    return NextResponse.json({
      success: true,
      queuePosition: result.queuePosition,
      wasCensored,
      censorExplanation: wasCensored ? censorExplanation : undefined,
      safePrompt: wasCensored ? finalPrompt : undefined,
    });
  } catch (error) {
    console.error("Error adding to prompt queue:", error);
    return createErrorResponse(500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAllowedHost(request)) {
      const user = await getPrivyUser();
      if (!user) {
        return createErrorResponse(401, ERROR_MESSAGES.UNAUTHORIZED);
      }
    }

    const searchParams = request.nextUrl.searchParams;
    const streamKey = searchParams.get("streamKey");

    if (!streamKey) {
      return createErrorResponse(400, "Missing streamKey parameter");
    }

    const result = await addRandomPrompt(streamKey);

    if (!result.success) {
      return createErrorResponse(429, ERROR_MESSAGES.QUEUE_FULL);
    }

    return NextResponse.json({
      success: true,
      queuePosition: result.queuePosition,
    });
  } catch (error) {
    console.error("Error adding random prompt:", error);
    return createErrorResponse(500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
}

export const dynamic = "force-dynamic";
