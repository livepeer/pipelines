import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { promptQueue } from "@/lib/db/schema/prompt-queue";
import { sql } from "drizzle-orm";
import { TrendingPrompt } from "../types";

export async function GET() {
  try {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    const trendingPrompts = await db
      .select({
        text: promptQueue.text,
        likes: promptQueue.likes,
        timestamp: promptQueue.timestamp,
      })
      .from(promptQueue)
      .where(sql`${promptQueue.timestamp} > ${threeHoursAgo}`)
      .orderBy(sql`${promptQueue.likes} DESC`)
      .limit(5);

    const formattedPrompts: TrendingPrompt[] = trendingPrompts.map(prompt => ({
      text: prompt.text,
      likes: prompt.likes || 0,
      timestamp: prompt.timestamp.getTime(),
    }));

    return NextResponse.json(formattedPrompts);
  } catch (error) {
    console.error("Error fetching trending prompts:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending prompts" },
      { status: 500 }
    );
  }
} 