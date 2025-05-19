import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { promptQueue } from "@/lib/db/schema/prompt-queue";
import { eq, sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { text, action } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (action === "unlike") {
      // Decrement likes, but not below 0
      await db
        .update(promptQueue)
        .set({
          likes: sql`GREATEST(COALESCE(likes, 0) - 1, 0)`,
        })
        .where(eq(promptQueue.text, text));
    } else {
      // Default to 'like'
      await db
        .update(promptQueue)
        .set({
          likes: sql`COALESCE(likes, 0) + 1`,
        })
        .where(eq(promptQueue.text, text));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error liking/unliking prompt:", error);
    return NextResponse.json(
      { error: "Failed to like/unlike prompt" },
      { status: 500 },
    );
  }
}
