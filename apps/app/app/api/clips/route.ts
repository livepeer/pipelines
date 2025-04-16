import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  clips as clipsTable,
  users as usersTable,
  clipSlugs as clipSlugsTable,
} from "@/lib/db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || "0");
  const limit = Number(searchParams.get("limit") || "12");

  if (limit > 100) {
    return NextResponse.json(
      {
        error: "Limit cannot exceed 100",
      },
      { status: 400 },
    );
  }

  const offset = page * limit;

  try {
    const clips = await db
      .select({
        id: clipsTable.id,
        video_url: clipsTable.video_url,
        video_title: clipsTable.video_title,
        created_at: clipsTable.created_at,
        author_name: usersTable.name,
        remix_count: sql<number>`(
            SELECT count(*)
            FROM ${clipsTable} AS derived_clips
            WHERE derived_clips.source_clip_id = ${clipsTable.id}
          )`.mapWith(Number),
        slug: clipSlugsTable.slug,
      })
      .from(clipsTable)
      .innerJoin(usersTable, eq(clipsTable.author_user_id, usersTable.id))
      .leftJoin(clipSlugsTable, eq(clipsTable.id, clipSlugsTable.clip_id))
      .orderBy(clipsTable.created_at)
      .limit(limit)
      .offset(offset);

    // TODO: pass next page clips also
    const nextPageClips = await db
      .select({
        id: clipsTable.id,
        video_url: clipsTable.video_url,
        video_title: clipsTable.video_title,
        created_at: clipsTable.created_at,
        author_name: usersTable.name,
        remix_count: sql<number>`(
          SELECT count(*)
          FROM ${clipsTable} AS derived_clips
          WHERE derived_clips.source_clip_id = ${clipsTable.id}
        )`.mapWith(Number),
        slug: clipSlugsTable.slug,
      })
      .from(clipsTable)
      .innerJoin(usersTable, eq(clipsTable.author_user_id, usersTable.id))
      .leftJoin(clipSlugsTable, eq(clipsTable.id, clipSlugsTable.clip_id))
      .orderBy(clipsTable.created_at)
      .limit(1)
      .offset(offset + limit);

    const hasMore = nextPageClips.length > 0;

    return NextResponse.json({
      clips,
      hasMore,
    });
  } catch (error) {
    console.error("Failed to fetch clips:", error);
    return NextResponse.json(
      { error: "Failed to fetch clips" },
      { status: 500 },
    );
  }
}
