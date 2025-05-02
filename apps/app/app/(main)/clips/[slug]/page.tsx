import QuickviewVideo from "@/app/(main)/QuickviewVideo";
import { db } from "@/lib/db";
import {
  clipSlugs as clipSlugsTable,
  clips as clipsTable,
  users as usersTable,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
      remix_count: clipsTable.remix_count,
      author_name: usersTable.name,
      author_details: usersTable.additionalDetails,
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
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = params;
  const clip = await getClipBySlug(slug);

  if (!clip) {
    return {};
  }

  const previousImages = (await parent).openGraph?.images || [];

  // Get base URL from metadata base or fallback to relative URL
  // This makes it work in any environment without hardcoding
  const baseUrl = (await parent).metadataBase?.toString() || "";
  const absolutePlayerUrl = `${baseUrl}/embed/clips/${slug}`.replace(
    /\/+$/,
    "",
  );

  // Use the clip's thumbnail - if for some reason it's null, use environment-aware fallback
  const thumbnailUrl = clip.thumbnail_url || `${baseUrl}/default-thumbnail.jpg`;

  // Format the prompt for display, or use a default
  const formattedPrompt =
    clip.prompt || "Check out this AI-generated video on Daydream";

  // Craft a title that includes the creator's name
  const title = `${clip.author_name}'s AI Video on Daydream`;

  // Assume square video
  const videoWidth = 512;
  const videoHeight = 512;

  return {
    title,
    description: formattedPrompt,
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000",
    ),
    openGraph: {
      title,
      description: formattedPrompt,
      images: [thumbnailUrl, ...previousImages],
      videos: [
        {
          url: clip.video_url,
          width: videoWidth,
          height: videoHeight,
          type: "video/mp4",
        },
      ],
      type: "video.other",
      siteName: "Daydream",
      locale: "en_US",
    },
    twitter: {
      card: "player",
      title,
      description: formattedPrompt,
      images: [thumbnailUrl],
      creator: "@daydreamlabs",
      players: [
        {
          playerUrl: absolutePlayerUrl,
          width: videoWidth,
          height: videoHeight,
          streamUrl: clip.video_url,
        },
      ],
    },
    other: {
      "theme-color": "#ffffff",
      // Facebook-specific video tags
      "og:video": clip.video_url,
      "og:video:secure_url": clip.video_url,
      "og:video:type": "video/mp4",
      "og:video:width": videoWidth.toString(),
      "og:video:height": videoHeight.toString(),
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
        authorDetails={clip.author_details as any}
        createdAt={clip.created_at.toISOString()}
      >
        <></>
      </QuickviewVideo>
    </>
  );
}
