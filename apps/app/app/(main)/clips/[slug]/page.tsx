import QuickviewVideo from "@/app/(main)/QuickviewVideo";
import { db } from "@/lib/db";
import {
  clipSlugs as clipSlugsTable,
  clips as clipsTable,
  users as usersTable,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";

async function getClipBySlug(slug: string) {
  const result = await db
    .select({
      id: clipsTable.id,
      video_url: clipsTable.video_url,
      video_title: clipsTable.video_title,
      created_at: clipsTable.created_at,
      prompt: clipsTable.prompt,
      thumbnail_url: clipsTable.thumbnail_url,
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

// Generate metadata for the page
export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = params;
  const clip = await getClipBySlug(slug);
  
  if (!clip) {
    return {};
  }
  
  const previousImages = (await parent).openGraph?.images || [];
  
  // Use the clip's thumbnail - if for some reason it's null, use a fallback
  const thumbnailUrl = clip.thumbnail_url || 'https://daydream.live/default-thumbnail.jpg';
  
  // Format the prompt for display, or use a default
  const formattedPrompt = clip.prompt || "Check out this AI-generated video on Daydream";
  
  // Craft a title that includes the creator's name
  const title = `${clip.author_name}'s AI Video on Daydream`;
  
  return {
    title,
    description: formattedPrompt,
    openGraph: {
      title,
      description: formattedPrompt,
      images: [thumbnailUrl, ...previousImages],
      type: 'video.other',
      siteName: 'Daydream',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: formattedPrompt,
      images: [thumbnailUrl],
      creator: '@daydreamlabs',
    },
    other: {
      'theme-color': '#ffffff',
    },
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const clip = await getClipBySlug(slug);

  if (!clip) {
    return redirect("/");
  }

  return (
    <>
      <QuickviewVideo
        key={String(clip.id)}
        src={clip.video_url}
        clipId={String(clip.id)}
        prompt={clip.prompt}
        title={clip.video_title || "Vincent Van Gogh"}
        authorName={clip.author_name || "Livepeer"}
        createdAt={clip.created_at.toISOString()}
        remixCount={clip.remix_count}
      >
        <></>
      </QuickviewVideo>
    </>
  );
}
