import { db } from "@/lib/db";
import {
  clipSlugs as clipSlugsTable,
  clips as clipsTable,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Metadata } from "next";

async function getClipBySlug(slug: string) {
  const result = await db
    .select({
      id: clipsTable.id,
      video_url: clipsTable.video_url,
    })
    .from(clipsTable)
    .innerJoin(clipSlugsTable, eq(clipsTable.id, clipSlugsTable.clip_id))
    .where(eq(clipSlugsTable.slug, slug));

  return result[0];
}

export const metadata: Metadata = {
  title: "Video Player",
  description: "Embedded video player",
};

export default async function EmbedPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const clip = await getClipBySlug(slug);

  if (!clip) {
    return redirect("/");
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-full max-w-[1280px] aspect-video">
        <video
          src={clip.video_url}
          controls
          autoPlay
          loop
          playsInline
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
} 