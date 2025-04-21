import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clips as clipsTable } from "@/lib/db/schema";
import {
  buildClipPath,
  buildThumbnailPath,
  uploadToGCS,
} from "@/lib/storage/gcp";
import { getPrivyUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

const ClipUploadSchema = z.object({
  title: z.string().optional(),
  prompt: z.string().default(""),
  sourceClipId: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const privyUser = await getPrivyUser();
    if (!privyUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = privyUser.userId;

    const formData = await request.formData();
    const clipFile = formData.get("clipFile") as File | null;
    const thumbnailFile = formData.get("thumbnailFile") as File | null;
    const title = formData.get("title") as string | null;
    const prompt = (formData.get("prompt") as string) || "";
    const sourceClipId = formData.get("sourceClipId")
      ? Number(formData.get("sourceClipId"))
      : null;

    if (!clipFile) {
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

    const [newClip] = await db
      .insert(clipsTable)
      .values({
        video_url: "",
        video_title: title || null,
        thumbnail_url: null,
        author_user_id: userId,
        source_clip_id: sourceClipId || null,
        prompt: prompt,
      })
      .returning();

    const clipId = newClip.id;

    const clipBuffer = Buffer.from(await clipFile.arrayBuffer());
    const clipPath = buildClipPath(userId, clipId, "clip.mp4");
    const clipUrl = await uploadToGCS(
      clipBuffer,
      clipPath,
      clipFile.type || "video/mp4",
    );

    const noWatermarkPath = buildClipPath(
      userId,
      clipId,
      "clip-nowatermark.mp4",
    );
    const noWatermarkClipUrl = await uploadToGCS(
      clipBuffer,
      noWatermarkPath,
      clipFile.type || "video/mp4",
    );

    let thumbnailUrl = null;
    if (thumbnailFile) {
      const thumbnailBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
      const thumbnailPath = buildThumbnailPath(userId, clipId);
      thumbnailUrl = await uploadToGCS(
        thumbnailBuffer,
        thumbnailPath,
        thumbnailFile.type || "image/jpeg",
      );
    }

    await db
      .update(clipsTable)
      .set({
        video_url: clipUrl,
        thumbnail_url: thumbnailUrl,
      })
      .where(eq(clipsTable.id, clipId));

    return NextResponse.json({
      success: true,
      clip: {
        id: clipId,
        videoUrl: clipUrl,
        noWatermarkVideoUrl: noWatermarkClipUrl,
        thumbnailUrl: thumbnailUrl,
        title: title,
      },
    });
  } catch (error) {
    console.error("Error uploading clip:", error);
    return NextResponse.json(
      { error: "Failed to upload clip" },
      { status: 500 },
    );
  }
}
