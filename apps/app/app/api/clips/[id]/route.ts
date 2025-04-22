import { getPrivyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  clipSlugs as clipSlugsTable,
  clips as clipsTable,
  users as usersTable,
} from "@/lib/db/schema";
import {
  buildClipPath,
  buildThumbnailUrl,
  uploadToGCS,
} from "@/lib/storage/gcp";
import { eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  if (!id || isNaN(parseInt(id))) {
    return NextResponse.json({ error: "Invalid clip ID" }, { status: 400 });
  }

  const clipId = parseInt(id);

  try {
    const [clip] = await db
      .select({
        id: clipsTable.id,
        video_url: clipsTable.video_url,
        video_title: clipsTable.video_title,
        thumbnail_url: clipsTable.thumbnail_url,
        author_user_id: clipsTable.author_user_id,
        author_name: usersTable.name,
        created_at: clipsTable.created_at,
        prompt: clipsTable.prompt,
      })
      .from(clipsTable)
      .innerJoin(usersTable, eq(clipsTable.author_user_id, usersTable.id))
      .where(eq(clipsTable.id, clipId))
      .limit(1);

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    const user = await getPrivyUser();

    const canAccessNoWatermark = user && user.userId === clip.author_user_id;

    let noWatermarkUrl = null;
    if (canAccessNoWatermark) {
      const videoUrl = clip.video_url;
      if (videoUrl && videoUrl.includes("storage.googleapis.com")) {
        const noWatermarkPath = buildClipPath(
          clip.author_user_id,
          clipId.toString(),
          "clip.mp4",
        );
        const bucketName = videoUrl.split("/")[3];
        noWatermarkUrl = `https://storage.googleapis.com/${bucketName}/${noWatermarkPath}`;
      }
    }

    return NextResponse.json({
      id: clip.id,
      title: clip.video_title,
      url: clip.video_url,
      noWatermarkUrl,
      thumbnailUrl: clip.thumbnail_url,
      authorId: clip.author_user_id,
      authorName: clip.author_name,
      createdAt: clip.created_at,
      prompt: clip.prompt,
    });
  } catch (error) {
    console.error("Error fetching clip:", error);
    return NextResponse.json(
      { error: "Failed to fetch clip" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  if (!id || isNaN(parseInt(id))) {
    return NextResponse.json({ error: "Invalid clip ID" }, { status: 400 });
  }

  try {
    const user = await getPrivyUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clipId = parseInt(id);

    const [clip] = await db
      .select()
      .from(clipsTable)
      .where(eq(clipsTable.id, clipId))
      .limit(1);

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    if (clip.author_user_id !== user.userId) {
      return NextResponse.json(
        { error: "You don't have permission to delete this clip" },
        { status: 403 },
      );
    }

    await db
      .update(clipsTable)
      .set({
        deleted_at: new Date(),
      })
      .where(eq(clipsTable.id, clipId));

    return NextResponse.json({
      success: true,
      message: "Clip deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting clip:", error);
    return NextResponse.json(
      { error: "Failed to delete clip" },
      { status: 500 },
    );
  }
}

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
    const sourceClip = formData.get("sourceClip") as File | null;
    const watermarkedClip = formData.get("watermarkedClip") as File | null;
    const thumbnail = formData.get("thumbnail") as File | null;

    const title = formData.get("title") as string | null;
    const prompt = (formData.get("prompt") as string) || "";
    const sourceClipId = formData.get("sourceClipId")
      ? Number(formData.get("sourceClipId"))
      : null;

    if (!sourceClip) {
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

    const clipBuffer = Buffer.from(await sourceClip.arrayBuffer());
    const fileType = sourceClip.type || "video/mp4";
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

    let watermarkedClipUrl = "";
    if (watermarkedClip) {
      try {
        const watermarkedBuffer = Buffer.from(
          await watermarkedClip.arrayBuffer(),
        );
        const watermarkedFileType = watermarkedClip.type || "video/mp4";
        const watermarkedPath = buildClipPath(
          userId,
          clipId,
          "watermarked-clip.mp4",
        );
        watermarkedClipUrl = await uploadToGCS(
          watermarkedBuffer,
          watermarkedPath,
          watermarkedFileType,
        );
      } catch (uploadError) {
        console.error(
          `Watermarked clip upload failed for clipId ${clipId}:`,
          uploadError,
        );
      }
    }

    let thumbnailUrl;
    if (thumbnail) {
      try {
        const thumbnailBuffer = Buffer.from(await thumbnail.arrayBuffer());
        const thumbnailFileType = thumbnail.type || "image/jpeg";
        const thumbnailPath = buildClipPath(userId, clipId, "thumbnail.jpg");
        thumbnailUrl = await uploadToGCS(
          thumbnailBuffer,
          thumbnailPath,
          thumbnailFileType,
        );
      } catch (uploadError) {
        console.error(
          `Thumbnail upload failed for clipId ${clipId}:`,
          uploadError,
        );
        thumbnailUrl = buildThumbnailUrl(userId, clipId);
      }
    } else {
      thumbnailUrl = buildThumbnailUrl(userId, clipId);
    }

    await db
      .update(clipsTable)
      .set({
        video_url: watermarkedClipUrl || clipUrl,
        thumbnail_url: thumbnailUrl,
        status: "completed",
      })
      .where(eq(clipsTable.id, clipId));

    return NextResponse.json({
      success: true,
      clip: {
        id: clipId,
        videoUrl: watermarkedClipUrl || clipUrl,
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
