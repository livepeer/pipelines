import QuickviewVideo from "@/app/explore/QuickviewVideo";
import {
  clips as clipsTable,
  users as usersTable,
  clipSlugs as clipSlugsTable,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";

async function getClipBySlug(slug: string) {
  const result = await db
    .select({
      id: clipsTable.id,
      video_url: clipsTable.video_url,
      video_title: clipsTable.video_title,
      created_at: clipsTable.created_at,
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
    .innerJoin(clipSlugsTable, eq(clipsTable.id, clipSlugsTable.clip_id))
    .where(eq(clipSlugsTable.slug, slug));

  return result[0];
}

export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const clip = await getClipBySlug(slug);
  // TODO: No clip

  return (
    // <>{slug}</>

    <QuickviewVideo
      src={clip.video_url}
      clipId={String(clip.id)}
      title={clip.video_title || "Vincent Van Gogh"}
      authorName={clip.author_name || "Livepeer"}
      createdAt={clip.created_at.toISOString()}
      remixCount={clip.remix_count}
    >
      asdf
    </QuickviewVideo>

    // <div className="absolute top-0 left-0 h-10 w-10 bg-black text-white">
    //   {slug}
    // </div>
  );
}
