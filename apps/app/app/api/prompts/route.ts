import { NextResponse } from "next/server";
import { AddPromptSchema, AddPromptRequest } from "./types";
import { getPromptState, addToPromptQueue, addRandomPrompt } from "./store";

export async function GET() {
  try {
    const state = getPromptState();
    return NextResponse.json(state);
  } catch (error) {
    console.error("Error getting prompt state:", error);
    return NextResponse.json(
      { error: "Failed to get prompt state" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: AddPromptRequest = await request.json();

    const result = AddPromptSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: result.error.format() },
        { status: 400 },
      );
    }

    const { text, seed, isUser, sessionId } = body;
    const response = addToPromptQueue(text, seed, isUser, sessionId);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error adding prompt:", error);
    return NextResponse.json(
      { error: "Failed to add prompt" },
      { status: 500 },
    );
  }
}

export async function PATCH() {
  try {
    // Commented out random prompt functionality
    // const response = addRandomPrompt();
    // return NextResponse.json(response);

    // Return an empty response instead
    return NextResponse.json({
      success: false,
      message: "Random prompts disabled",
    });
  } catch (error) {
    console.error("Error adding random prompt:", error);
    return NextResponse.json(
      { error: "Failed to add random prompt" },
      { status: 500 },
    );
  }
}
