import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clips as clipsTable, users } from "@/lib/db/schema";
import { requireAdminAuth } from "@/app/api/admin/auth";
import { eq, isNull, isNotNull, asc, and } from "drizzle-orm";

type AdminFetchedClip = {
  id: number;
  video_url: string;
  video_title: string | null;
  thumbnail_url: string | null;
  author_user_id: string;
  source_clip_id: number | null;
  prompt: string;
  priority: number | null;
  created_at: Date;
  deleted_at: Date | null;
  author: {
    id: string;
    name: string | null;
  } | null;
};

export async function GET(request: Request) {
  try {
    const authResponse = await requireAdminAuth(request);

    if (authResponse.status !== 200) {
      return authResponse;
    }

    const selectFields = {
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
    };

    const prioritizedClips = (await db
      .select(selectFields)
      .from(clipsTable)
      .leftJoin(users, eq(clipsTable.author_user_id, users.id)) // Left join for author
      .where(and(isNull(clipsTable.deleted_at), isNotNull(clipsTable.priority)))
      .orderBy(asc(clipsTable.priority))) as AdminFetchedClip[];

    const nonPrioritizedClips = (await db
      .select(selectFields)
      .from(clipsTable)
      .leftJoin(users, eq(clipsTable.author_user_id, users.id)) // Left join for author
      .where(and(isNull(clipsTable.deleted_at), isNull(clipsTable.priority)))
      .orderBy(asc(clipsTable.created_at))) as AdminFetchedClip[]; // Older first

    const finalClips: (AdminFetchedClip | null)[] = [];
    const priorityMap = new Map<number, AdminFetchedClip>();
    let maxPriority = 0;

    for (const clip of prioritizedClips) {
      if (clip.priority !== null && clip.priority > 0) {
        const position = clip.priority;
        if (position > maxPriority) {
          maxPriority = position;
        }
        if (priorityMap.has(position)) {
          console.warn(
            `[Admin API] Duplicate priority ${position} found for clips ${priorityMap.get(position)?.id} and ${clip.id}. Using clip ${clip.id}.`,
          );
        }
        priorityMap.set(position, clip);
      } else {
        console.warn(
          `[Admin API] Clip ${clip.id} has invalid priority: ${clip.priority}. Ignoring priority.`,
        );
        nonPrioritizedClips.push(clip);
        nonPrioritizedClips.sort(
          (a, b) => a.created_at.getTime() - b.created_at.getTime(),
        );
      }
    }

    const initialLength = Math.max(
      maxPriority,
      nonPrioritizedClips.length + priorityMap.size,
    );
    for (let i = 0; i < initialLength; i++) {
      finalClips[i] = null;
    }

    for (const [position, clip] of priorityMap.entries()) {
      if (position - 1 >= 0) {
        if (position - 1 >= finalClips.length) {
          for (let k = finalClips.length; k <= position - 1; k++) {
            finalClips[k] = null;
          }
        }
        finalClips[position - 1] = clip;
      }
    }

    let nonPrioritizedIndex = 0;
    for (
      let i = 0;
      i < finalClips.length && nonPrioritizedIndex < nonPrioritizedClips.length;
      i++
    ) {
      if (finalClips[i] === null) {
        finalClips[i] = nonPrioritizedClips[nonPrioritizedIndex++];
      }
    }

    while (nonPrioritizedIndex < nonPrioritizedClips.length) {
      finalClips.push(nonPrioritizedClips[nonPrioritizedIndex++]);
    }

    const finalNonNullClips = finalClips.filter(
      clip => clip !== null,
    ) as AdminFetchedClip[];

    return NextResponse.json(finalNonNullClips);
  } catch (error) {
    console.error("Failed to fetch clips:", error);
    return NextResponse.json(
      { error: "Failed to fetch clips" },
      { status: 500 },
    );
  }
}
