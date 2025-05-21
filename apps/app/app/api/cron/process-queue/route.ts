import type { MultiplayerPrompt } from "@/hooks/usePromptsApi";
import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET() {
  // Get the last 20 prompts
  const prompts = await redis.lrange<MultiplayerPrompt>("prompt:stream", 0, -1);

  if (prompts.length === 0) {
    return NextResponse.json({
      message: "No prompts found, active prompt cleared.",
    });
  }

  const currentActiveId = (await redis.get("prompt:active")) as string;

  let newActiveId: string;

  const currentIndex = prompts.findIndex(p => p.id === currentActiveId);

  console.log("currentIndex", currentIndex);

  if (currentIndex === -1) {
    // Active prompt is NOT in top 20 → reset to latest (index 0)
    newActiveId = prompts[0].id;
  } else if (currentIndex === 0) {
    newActiveId = currentActiveId;
  } else {
    // Rotate to next in the top 20 which is the previous index, add modulo correctly
    const nextIndex = (currentIndex - 1) % prompts.length;
    newActiveId = prompts[nextIndex].id;
  }

  console.log("newActiveId", newActiveId);

  await redis.set("prompt:active", newActiveId);

  return NextResponse.json({ activePromptId: newActiveId });
}
