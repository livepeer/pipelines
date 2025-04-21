import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clips as clipsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPrivyUser } from "@/lib/auth";
import {
  deleteFromGCS,
  buildClipPath,
  buildThumbnailPath,
} from "@/lib/storage/gcp";

export async function POST(
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

    try {
      const videoUrl = clip.video_url;
      if (videoUrl && videoUrl.includes("storage.googleapis.com")) {
        const userId = clip.author_user_id;

        const watermarkedPath = buildClipPath(userId, clipId, "clip.mp4");
        await deleteFromGCS(watermarkedPath);

        try {
          const nonWatermarkedPath = buildClipPath(
            userId,
            clipId,
            "clip-nowatermark.mp4",
          );
          await deleteFromGCS(nonWatermarkedPath);
        } catch (error) {
          console.log(
            `Non-watermarked version for clip ${clipId} not found or couldn't be deleted`,
          );
        }

        if (clip.thumbnail_url) {
          const thumbnailPath = buildThumbnailPath(userId, clipId);
          await deleteFromGCS(thumbnailPath);
        }
      }
    } catch (error) {
      console.error("Error deleting clip files from storage:", error);
    }

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
