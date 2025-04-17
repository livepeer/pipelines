import { eq, sql, isNull, isNotNull, asc, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  clips as clipsTable,
  users as usersTable,
  clipSlugs as clipSlugsTable,
} from "@/lib/db/schema";

type FetchedClip = {
  id: number;
  video_url: string;
  video_title: string | null;
  created_at: Date;
  author_name: string | null;
  remix_count: number;
  slug: string | null;
  priority: number | null; 
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || "0");
  const limit = Number(searchParams.get("limit") || "12");

  if (limit > 100 || limit <= 0) { 
    return NextResponse.json(
      {
        error: "Limit must be between 1 and 100",
      },
      { status: 400 },
    );
  }

  if (page < 0) { 
    return NextResponse.json(
      { error: "Page cannot be negative" },
      { status: 400 },
    );
  }

  const offset = page * limit;

  try {
    const selectFields = {
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
      priority: clipsTable.priority, 
    };

    const prioritizedClips = (await db
      .select(selectFields)
      .from(clipsTable)
      .innerJoin(usersTable, eq(clipsTable.author_user_id, usersTable.id))
      .leftJoin(clipSlugsTable, eq(clipsTable.id, clipSlugsTable.clip_id))
      .where(and(isNull(clipsTable.deleted_at), isNotNull(clipsTable.priority))) 
      .orderBy(asc(clipsTable.priority))) as FetchedClip[]; 

    const nonPrioritizedClips = (await db
      .select(selectFields)
      .from(clipsTable)
      .innerJoin(usersTable, eq(clipsTable.author_user_id, usersTable.id))
      .leftJoin(clipSlugsTable, eq(clipsTable.id, clipSlugsTable.clip_id))
      .where(and(isNull(clipsTable.deleted_at), isNull(clipsTable.priority))) 
      .orderBy(asc(clipsTable.created_at))) as FetchedClip[]; 

    const finalClips: (FetchedClip | null)[] = [];
    const priorityMap = new Map<number, FetchedClip>();
    let maxPriority = 0;

    for (const clip of prioritizedClips) {
      if (clip.priority !== null && clip.priority > 0) {
        const position = clip.priority;
        if (position > maxPriority) {
          maxPriority = position;
        }
        if (priorityMap.has(position)) {
           console.warn(`Duplicate priority ${position} found for clips ${priorityMap.get(position)?.id} and ${clip.id}. Using clip ${clip.id}.`);
        }
        priorityMap.set(position, clip);
      } else {
        console.warn(`Clip ${clip.id} has invalid priority: ${clip.priority}. Ignoring priority.`);
        nonPrioritizedClips.push(clip);
        nonPrioritizedClips.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

      }
    }


    const initialLength = Math.max(maxPriority, nonPrioritizedClips.length + priorityMap.size)
    for (let i = 0; i < initialLength; i++) {
       finalClips[i] = null 
    }


    for (const [position, clip] of priorityMap.entries()) {
        if(position -1 >= 0) { 
             if (position - 1 >= finalClips.length) {
                 for (let k = finalClips.length; k <= position - 1; k++) {
                     finalClips[k] = null;
                 }
             }
             finalClips[position - 1] = clip;
        }
    }


    let nonPrioritizedIndex = 0;
    for (let i = 0; i < finalClips.length && nonPrioritizedIndex < nonPrioritizedClips.length; i++) {
      if (finalClips[i] === null) {
        finalClips[i] = nonPrioritizedClips[nonPrioritizedIndex++];
      }
    }

    while (nonPrioritizedIndex < nonPrioritizedClips.length) {
      finalClips.push(nonPrioritizedClips[nonPrioritizedIndex++]);
    }

    const finalNonNullClips = finalClips.filter(clip => clip !== null) as FetchedClip[];

    const paginatedClips = finalNonNullClips.slice(offset, offset + limit);

    const totalClips = finalNonNullClips.length;
    const hasMore = offset + limit < totalClips;

    return NextResponse.json({
      clips: paginatedClips,
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
