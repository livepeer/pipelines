import { VideoPlayer } from "@/app/explore/VideoPlayer";
import { VideoProvider } from "@/app/explore/VideoProvider";
import { db } from "@/lib/db";
import {
  clipSlugs as clipSlugsTable,
  clips as clipsTable,
  users as usersTable,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { ChevronLeft, Repeat, User2 } from "lucide-react";
import Link from "next/link";

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

const formatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const clip = await getClipBySlug(slug);
  // TODO: No clip

  return (
    <div className="flex justify-center items-center min-h-screen bg-white sm:bg-[rgba(255,255,255,0.90)]">
      <div className="max-h-[90vh] max-w-2xl w-full border-none bg-transparent shadow-none pt-0 pb-4 backdrop-filter backdrop-blur-[3px]">
        <div className="space-y-8">
          <div className="relative w-full">
            <Link href="/explore">
              <button className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-medium text-[#09090B] outline-none hover:bg-zinc-100 px-2 py-1 rounded">
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:block">Back</span>
              </button>
            </Link>

            <div className="flex flex-col items-center gap-1 py-2 px-4">
              <h2 className="text-2xl font-bold text-[#232323]">
                {clip.video_title || "Vincent Van Gogh"}
              </h2>
              <div className="text-sm text-[#707070]">
                {formatter
                  .format(new Date(clip.created_at))
                  .replace(" at ", ", ")}
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-between items-center p-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center">
                <User2 className="w-4 h-4 text-[#09090B]" />
              </div>
              <span className="text-xs font-medium text-[#09090B]">
                {clip.author_name || "Livepeer"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Repeat className="w-4 h-4 text-[#09090B]" />
              <span className="text-sm text-[#09090B]">
                {clip.remix_count || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full h-fit relative mt-4">
          <VideoProvider src={clip.video_url}>
            <div className="relative w-full">
              <VideoPlayer />
            </div>
          </VideoProvider>
        </div>
      </div>
    </div>
  );
}
