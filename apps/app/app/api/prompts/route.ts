import { NextRequest, NextResponse } from "next/server";
import { getPromptState, addToPromptQueue, addRandomPrompt } from "./store";
import {
  isPromptNSFW as isPromptNSFW,
  getRandomSafePrompt,
} from "@/lib/nsfwCheck";
import track from "@/lib/track";

export async function GET() {
  try {
    const promptState = await getPromptState();
    return NextResponse.json(promptState);
  } catch (error) {
    console.error("Error getting prompt state:", error);
    return NextResponse.json(
      { error: "Failed to get prompt state" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, text, seed, isUser, sessionId } = body;

    const promptText = prompt || text;

    if (!promptText || typeof promptText !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid prompt/text in request body" },
        { status: 400 },
      );
    }

    if (!seed || typeof seed !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'seed' in request body" },
        { status: 400 },
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
        track("daydream_prompt_nsfw_check", {
          prompt: promptText,
          nsfw: true,
        });
      } else {
        track("daydream_prompt_nsfw_check", {
          nsfw: false,
        });
      }
    }

    const result = await addToPromptQueue(
      finalPrompt,
      seed,
      validatedIsUser,
      sessionId,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Queue is full, try again later" },
        { status: 429 },
      );
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
    return NextResponse.json(
      { error: "Failed to add to prompt queue" },
      { status: 500 },
    );
  }
}

export async function PUT() {
  try {
    const result = await addRandomPrompt();

    if (!result.success) {
      return NextResponse.json(
        { error: "Queue is full, try again later" },
        { status: 429 },
      );
    }

    return NextResponse.json({
      success: true,
      queuePosition: result.queuePosition,
    });
  } catch (error) {
    console.error("Error adding random prompt:", error);
    return NextResponse.json(
      { error: "Failed to add random prompt" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
