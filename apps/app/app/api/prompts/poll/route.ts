import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
    const rawData = await redis.lrange<string>("prompt:stream", 0, 99);
    const prompts = rawData.map((str: string) => JSON.parse(str));

    const activeId = await redis.get("prompt:active");
    const activeIndex = activeId
      ? prompts.findIndex(p => p.id === activeId)
      : -1;

    return NextResponse.json({ prompts, activeIndex });
  } catch (error) {
    console.error("Error fetching prompts:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompts" },
      { status: 500 },
    );
  }
}
