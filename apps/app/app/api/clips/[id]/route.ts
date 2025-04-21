import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clips as clipsTable, users as usersTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildClipPath } from "@/lib/storage/gcp";
import { getPrivyUser } from "@/lib/auth";

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
