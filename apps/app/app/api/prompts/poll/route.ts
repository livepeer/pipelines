import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { safePrompts } from "@/lib/nsfwCheck";
import { v4 as uuidv4 } from "uuid";
import type { MultiplayerPrompt } from "@/hooks/usePromptsApi";

async function initializeFewPromptsIfEmpty() {
  const randomPrompts = safePrompts.map(prompt => ({
    id: uuidv4(),
    content: prompt,
    created_at: Date.now().toString(),
  }));

  // Clear existing prompts to ensure clean initialization
  await redis.del("prompt:stream");

  // Add each prompt to Redis
  for (const prompt of randomPrompts) {
    await redis.lpush("prompt:stream", JSON.stringify(prompt));
  }

  await redis.set("prompt:active", randomPrompts[randomPrompts.length - 1].id);

  return {
    prompts: randomPrompts,
    activeIndex: randomPrompts[randomPrompts.length - 1].id,
  };
}

export async function GET() {
  try {
    const prompts = await redis.lrange<MultiplayerPrompt>(
      "prompt:stream",
      0,
      -1,
    );

    const activeId = await redis.get("prompt:active");

    if (prompts.length === 0) {
      console.log("Initializing few prompts");
      const data = await initializeFewPromptsIfEmpty();
      return NextResponse.json(data, { status: 200 });
    }

    return NextResponse.json({ prompts, activeIndex: activeId ?? -1 });
  } catch (error) {
    console.error("Error fetching prompts:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompts" },
      { status: 500 },
    );
  }
}
