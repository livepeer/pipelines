import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET() {
  // Get the last 20 prompts
  const rawPrompts = await redis.lrange("prompt:stream", 0, 19); // 0 = latest
  const prompts = rawPrompts.map(str => JSON.parse(str));
  if (prompts.length === 0) {
    await redis.del("prompt:active");
    console.log("No prompts found, active prompt cleared.");
    return NextResponse.json({
      message: "No prompts found, active prompt cleared.",
    });
  }

  const currentActiveId = await redis.get("prompt:active");

  let newActiveId: string;

  const currentIndex = prompts.findIndex(p => p.id === currentActiveId);

  if (currentIndex === -1) {
    // Active prompt is NOT in top 20 → reset to latest (index 0)
    newActiveId = prompts[0].id;
  } else {
    // Rotate to next in the top 20
    const nextIndex = (currentIndex + 1) % prompts.length;
    newActiveId = prompts[nextIndex].id;
  }

  await redis.set("prompt:active", newActiveId);

  return NextResponse.json({ activePromptId: newActiveId });
}
