import { db } from "@/lib/db";
import {
  clips as clipsTable,
  users as usersTable,
  clipSlugs as clipSlugsTable,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { BentoGrids } from "./BentoGrids";
import Header from "./Header";

async function getInitialClips() {
  const clips = await db
    .select({
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
    })
    .from(clipsTable)
    .innerJoin(usersTable, eq(clipsTable.author_user_id, usersTable.id))
    .leftJoin(clipSlugsTable, eq(clipsTable.id, clipSlugsTable.clip_id))
    .orderBy(clipsTable.created_at)
    .limit(12);

  return clips.map(clip => ({
    id: String(clip.id),
    video_url: clip.video_url,
    video_title: clip.video_title,
    created_at: clip.created_at.toISOString(),
    prompt: clip.prompt,
    author_name: clip.author_name,
    remix_count: clip.remix_count,
    slug: clip.slug,
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
