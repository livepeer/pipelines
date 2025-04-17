import { db } from "@/lib/db";
import {
  clips as clipsTable,
  users as usersTable,
  clipSlugs as clipSlugsTable,
} from "@/lib/db/schema";
import { eq, sql, isNull, isNotNull, asc, and } from "drizzle-orm";
import { BentoGrids } from "./BentoGrids";
import Header from "./Header";

type InitialFetchedClip = {
  id: number;
  video_url: string;
  video_title: string | null;
  created_at: Date;
  prompt: string;
  remix_count: number;
  author_name: string | null;
  slug: string | null;
  priority: number | null;
};

async function getInitialClips() {
  const selectFields = {
    id: clipsTable.id,
    video_url: clipsTable.video_url,
    video_title: clipsTable.video_title,
    created_at: clipsTable.created_at,
    prompt: clipsTable.prompt,
    remix_count: sql<number>`(
          SELECT count(*) 
          FROM ${clipsTable} AS remixed_clips
          WHERE remixed_clips.source_clip_id = ${clipsTable.id}
        )`.mapWith(Number),
    author_name: usersTable.name,
    slug: clipSlugsTable.slug,
    priority: clipsTable.priority,
  };

  const prioritizedClips = (await db
    .select(selectFields)
    .from(clipsTable)
    .innerJoin(usersTable, eq(clipsTable.author_user_id, usersTable.id))
    .leftJoin(clipSlugsTable, eq(clipsTable.id, clipSlugsTable.clip_id))
    .where(and(isNull(clipsTable.deleted_at), isNotNull(clipsTable.priority)))
    .orderBy(asc(clipsTable.priority))) as InitialFetchedClip[];

  const nonPrioritizedClips = (await db
    .select(selectFields)
    .from(clipsTable)
    .innerJoin(usersTable, eq(clipsTable.author_user_id, usersTable.id))
    .leftJoin(clipSlugsTable, eq(clipsTable.id, clipSlugsTable.clip_id))
    .where(and(isNull(clipsTable.deleted_at), isNull(clipsTable.priority)))
    .orderBy(asc(clipsTable.created_at))) as InitialFetchedClip[]; // Older first

  const finalClips: (InitialFetchedClip | null)[] = [];
  const priorityMap = new Map<number, InitialFetchedClip>();
  let maxPriority = 0;

  for (const clip of prioritizedClips) {
    if (clip.priority !== null && clip.priority > 0) {
      const position = clip.priority;
      if (position > maxPriority) {
        maxPriority = position;
      }
      if (priorityMap.has(position)) {
        console.warn(
          `[getInitialClips] Duplicate priority ${position} found for clips ${priorityMap.get(position)?.id} and ${clip.id}. Using clip ${clip.id}.`,
        );
      }
      priorityMap.set(position, clip);
    } else {
      console.warn(
        `[getInitialClips] Clip ${clip.id} has invalid priority: ${clip.priority}. Ignoring priority.`,
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
  ) as InitialFetchedClip[];

  const initialSortedClips = finalNonNullClips.slice(0, 12);

  return initialSortedClips.map(clip => ({
    id: String(clip.id),
    video_url: clip.video_url,
    video_title: clip.video_title,
    created_at: clip.created_at.toISOString(),
    prompt: clip.prompt,
    author_name: clip.author_name,
    remix_count: clip.remix_count,
    slug: clip.slug,
    priority: clip.priority,
  }));
}

export default async function Explore() {
  const initialClips = await getInitialClips();

  return (
    <>
      <div className="bg-gray-50 relative isolate">
        <Header />
        <BentoGrids initialClips={initialClips} />
      </div>
    </>
  );
}
