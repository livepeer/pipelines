import { db } from "@/lib/db";
import { clipsTable, usersTable, clipSlugsTable } from "@/lib/db/schema";
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
      id: clipsTable.id,
      video_url: clipsTable.video_url,
      video_title: clipsTable.video_title,
      created_at: clipsTable.created_at,
      prompt: clipsTable.prompt,
      thumbnail_url: clipsTable.thumbnail_url,
      remix_count: clipsTable.remix_count,
      author_name: usersTable.name,
      author_details: usersTable.additionalDetails,
      slug: clipSlugsTable.slug,
      is_tutorial: clipsTable.is_tutorial,
    })
    .from(clipsTable)
    .innerJoin(usersTable, eq(clipsTable.author_user_id, usersTable.id))
    .innerJoin(clipSlugsTable, eq(clipsTable.id, clipSlugsTable.clip_id))
    .where(eq(clipsTable.author_user_id, userId))
    .orderBy(clipsTable.created_at);

  return NextResponse.json({ clips: result });
} 