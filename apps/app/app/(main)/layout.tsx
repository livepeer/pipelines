import { db } from "@/lib/db";
import {
  clipSlugs as clipSlugsTable,
  clips as clipsTable,
  users as usersTable,
} from "@/lib/db/schema";
import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import Header from "./Header";
import MainLayoutClient from "./MainLayoutClient";

export const dynamic = "force-dynamic";

type InitialFetchedClip = {
  id: number;
  video_url: string;
  video_title: string | null;
  created_at: Date;
  prompt: string;
  remix_count: number;
  author_name: string | null;
  author_details: Record<string, any> | null;
  slug: string | null;
  priority: number | null;
  is_tutorial: boolean;
};

async function getInitialClips() {
  const selectFields = {
    id: clipsTable.id,
    video_url: clipsTable.video_url,
    video_title: clipsTable.video_title,
    created_at: clipsTable.created_at,
    prompt: clipsTable.prompt,
    remix_count: clipsTable.remix_count,
    author_name: usersTable.name,
    author_details: usersTable.additionalDetails,
    slug: clipSlugsTable.slug,
    priority: clipsTable.priority,
    is_tutorial: clipsTable.is_tutorial,
  };

  const prioritizedClips = (await db
    .select(selectFields)
    .from(clipsTable)
    .innerJoin(usersTable, eq(clipsTable.author_user_id, usersTable.id))
    .leftJoin(clipSlugsTable, eq(clipsTable.id, clipSlugsTable.clip_id))
    .where(
      and(
        isNull(clipsTable.deleted_at),
        isNotNull(clipsTable.priority),
        eq(clipsTable.status, "completed"),
        eq(clipsTable.approval_status, "approved"),
      ),
    )
    .orderBy(asc(clipsTable.priority))) as InitialFetchedClip[];

  const initialNonPrioritizedClips = (await db
    .select(selectFields)
    .from(clipsTable)
    .innerJoin(usersTable, eq(clipsTable.author_user_id, usersTable.id))
    .leftJoin(clipSlugsTable, eq(clipsTable.id, clipSlugsTable.clip_id))
    .where(
      and(
        isNull(clipsTable.deleted_at),
        isNull(clipsTable.priority),
        eq(clipsTable.status, "completed"),
        eq(clipsTable.approval_status, "approved"),
      ),
    )
    .orderBy(
      desc(clipsTable.remix_count),
      asc(clipsTable.created_at),
    )) as InitialFetchedClip[];

  const finalClips: (InitialFetchedClip | null)[] = [];
  const priorityMap = new Map<number, InitialFetchedClip>();
  let maxPriority = 0;

  const demotedClips: InitialFetchedClip[] = [];

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
      demotedClips.push(clip);
    }
  }

  const nonPrioritizedClips = [...initialNonPrioritizedClips, ...demotedClips];
  nonPrioritizedClips.sort((a, b) => {
    if (a.remix_count === null && b.remix_count === null) return 0;
    if (a.remix_count === null) return 1; // a가 null이면 뒤로
    if (b.remix_count === null) return -1; // b가 null이면 앞으로

    if (b.remix_count !== a.remix_count) {
      return b.remix_count - a.remix_count;
    }
    // tie-breaker, older first
    const timeA =
      a.created_at instanceof Date
        ? a.created_at.getTime()
        : new Date(a.created_at).getTime();
    const timeB =
      b.created_at instanceof Date
        ? b.created_at.getTime()
        : new Date(b.created_at).getTime();
    return timeA - timeB;
  });

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
    author_details: clip.author_details,
    remix_count: clip.remix_count,
    slug: clip.slug,
    priority: clip.priority,
    is_tutorial: clip.is_tutorial,
  }));
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialClips = await getInitialClips();

  return (
    <>
      <div className="bg-gray-50 relative isolate">
        <Header />
        <MainLayoutClient initialClips={initialClips}>
          {children}
        </MainLayoutClient>
      </div>
    </>
  );
}
