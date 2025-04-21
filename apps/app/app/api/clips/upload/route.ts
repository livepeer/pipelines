import { getPrivyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  clips as clipsTable,
  clipSlugs as clipSlugsTable,
} from "@/lib/db/schema";
import {
  buildClipPath,
  buildThumbnailUrl,
  uploadToGCS,
} from "@/lib/storage/gcp";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { customAlphabet } from "nanoid";

const generateSlug = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  6,
);

const ClipUploadSchema = z.object({
  title: z.string().optional(),
  prompt: z.string().default(""),
  sourceClipId: z.number().nullable(),
});

export async function POST(request: NextRequest) {
  let clipId: number | null = null;
  let userId: string;

  try {
    const privyUser = await getPrivyUser();
    if (!privyUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = privyUser.userId;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const prompt = (formData.get("prompt") as string) || "";
    const sourceClipId = formData.get("sourceClipId")
      ? Number(formData.get("sourceClipId"))
      : null;

    if (!file) {
      return NextResponse.json(
        { error: "Invalid request", details: "No clip file provided" },
        { status: 400 },
      );
    }

    const result = ClipUploadSchema.safeParse({
      title,
      prompt,
      sourceClipId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 },
      );
    }

    const { initialClipId, slug } = await db.transaction(async tx => {
      const [newClip] = await tx
        .insert(clipsTable)
        .values({
          video_url: "",
          video_title: title || null,
          thumbnail_url: null,
          author_user_id: userId,
          source_clip_id: sourceClipId || null,
          prompt: prompt,
          status: "uploading",
        })
        .returning({ id: clipsTable.id });

      const generatedSlug = generateSlug();
      await tx.insert(clipSlugsTable).values({
        slug: generatedSlug,
        clip_id: newClip.id,
      });

      return { initialClipId: newClip.id, slug: generatedSlug };
    });

    clipId = initialClipId;

    const clipBuffer = Buffer.from(await file.arrayBuffer());
    const fileType = file.type || "video/mp4";
    const clipPath = buildClipPath(userId, clipId, "clip.mp4");

    let clipUrl: string;
    try {
      clipUrl = await uploadToGCS(clipBuffer, clipPath, fileType);
    } catch (uploadError) {
      console.error(`GCS Upload failed for clipId ${clipId}:`, uploadError);
      try {
        await db
          .update(clipsTable)
          .set({ status: "failed" })
          .where(eq(clipsTable.id, clipId));
      } catch (dbError) {
        console.error(
          `Failed to update status to 'failed' for clipId ${clipId}:`,
          dbError,
        );
      }
      return NextResponse.json(
        { error: "Failed to upload clip to storage" },
        { status: 500 },
      );
    }

    const thumbnailUrl = buildThumbnailUrl(userId, clipId);

    await db
      .update(clipsTable)
      .set({
        video_url: clipUrl,
        thumbnail_url: thumbnailUrl,
        status: "completed",
      })
      .where(eq(clipsTable.id, clipId));

    return NextResponse.json({
      success: true,
      clip: {
        id: clipId,
        videoUrl: clipUrl,
        thumbnailUrl: thumbnailUrl,
        title: title,
        slug: slug,
        status: "completed",
      },
    });
  } catch (error) {
    console.error("Error processing clip upload:", error);

    if (
      clipId &&
      error instanceof Error &&
      !error.message.includes("Upload failed")
    ) {
      try {
        await db
          .update(clipsTable)
          .set({ status: "failed" })
          .where(eq(clipsTable.id, clipId));
        console.error(
          `Set status to 'failed' for clipId ${clipId} due to general error.`,
        );
      } catch (dbUpdateError) {
        console.error(
          `Failed to update status to 'failed' for clipId ${clipId} during general error handling:`,
          dbUpdateError,
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to process clip upload" },
      { status: 500 },
    );
  }
}
