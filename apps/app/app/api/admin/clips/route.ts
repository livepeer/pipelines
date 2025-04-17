import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clips as clipsTable, users } from "@/lib/db/schema";
import { requireAdminAuth } from "@/app/api/admin/auth";
import { eq, desc, isNull } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const authResponse = await requireAdminAuth(request);

    if (authResponse.status !== 200) {
      return authResponse;
    }

    const clips = await db
      .select({
        id: clipsTable.id,
        video_url: clipsTable.video_url,
        video_title: clipsTable.video_title,
        thumbnail_url: clipsTable.thumbnail_url,
        author_user_id: clipsTable.author_user_id,
        source_clip_id: clipsTable.source_clip_id,
        prompt: clipsTable.prompt,
        priority: clipsTable.priority,
        created_at: clipsTable.created_at,
        deleted_at: clipsTable.deleted_at,
        author: {
          id: users.id,
          name: users.name,
        },
      })
      .from(clipsTable)
      .leftJoin(users, eq(clipsTable.author_user_id, users.id))
      .where(isNull(clipsTable.deleted_at))
      .orderBy(desc(clipsTable.created_at));

    return NextResponse.json(clips);
  } catch (error) {
    console.error("Failed to fetch clips:", error);
    return NextResponse.json(
      { error: "Failed to fetch clips" },
      { status: 500 },
    );
  }
}
