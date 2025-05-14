import { db } from "@/lib/db";
import { clips, users, clipSlugs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const result = await db
    .select({
      id: clips.id,
      video_url: clips.video_url,
      video_title: clips.video_title,
      created_at: clips.created_at,
      prompt: clips.prompt,
      thumbnail_url: clips.thumbnail_url,
      remix_count: clips.remix_count,
      author_name: users.name,
      author_details: users.additionalDetails,
      slug: clipSlugs.slug,
      is_tutorial: clips.is_tutorial,
    })
    .from(clips)
    .innerJoin(users, eq(clips.author_user_id, users.id))
    .innerJoin(clipSlugs, eq(clips.id, clipSlugs.clip_id))
    .where(eq(clips.author_user_id, userId))
    .orderBy(clips.created_at);

  return NextResponse.json({ clips: result });
}
