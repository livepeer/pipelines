import { z } from "zod";
import { getPrivyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  clips as clipsTable,
  clipStatusEnum,
  users as usersTable,
} from "@/lib/db/schema";
import { buildFilePath, makePublicFromfileUrl } from "@/lib/storage/gcp";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

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
        author_details: usersTable.additionalDetails,
        created_at: clipsTable.created_at,
        prompt: clipsTable.prompt,
        is_tutorial: clipsTable.is_tutorial,
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
        const noWatermarkPath = buildFilePath(
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
      authorDetails: clip.author_details,
      createdAt: clip.created_at,
      prompt: clip.prompt,
      isTutorial: clip.is_tutorial,
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

const ClipUpdateSchema = z.object({
  videoUrl: z.string().url({ message: "Invalid video URL format" }).optional(),
  thumbnailUrl: z
    .string()
    .url({ message: "Invalid thumbnail URL format" })
    .optional(),
  status: z.string().min(1, { message: "Status cannot be empty" }).optional(),
});

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
    };
  },
) {
  const clipId = parseInt(params.id, 10);

  if (isNaN(clipId)) {
    return NextResponse.json({ error: "Invalid clip ID" }, { status: 400 });
  }

  let updateData: z.infer<typeof ClipUpdateSchema>;

  try {
    const jsonData = await request.json();
    const validationResult = ClipUpdateSchema.safeParse(jsonData);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    updateData = validationResult.data;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details:
            "At least one field (videoUrl, thumbnailUrl, status) must be provided for update.",
        },
        { status: 400 },
      );
    }

    const privyUser = await getPrivyUser();
    if (!privyUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = privyUser.userId;

    const updates: Partial<{
      video_url: string;
      thumbnail_url: string;
      status: (typeof clipStatusEnum.enumValues)[number];
      updated_at: Date;
    }> = {};

    const promises = [];

    if (updateData.videoUrl !== undefined) {
      updates.video_url = updateData.videoUrl;
      promises.push(makePublicFromfileUrl(updateData.videoUrl));
    }
    if (updateData.thumbnailUrl !== undefined) {
      updates.thumbnail_url = updateData.thumbnailUrl;
      promises.push(makePublicFromfileUrl(updateData.thumbnailUrl));
    }

    if (updateData.status !== undefined) {
      updates.status =
        updateData.status as (typeof clipStatusEnum.enumValues)[number];
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date();
    } else {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    await Promise.all(promises);

    const [updatedClip] = await db
      .update(clipsTable)
      .set(updates)
      .where(
        and(eq(clipsTable.id, clipId), eq(clipsTable.author_user_id, userId)),
      )
      .returning({
        id: clipsTable.id,
        status: clipsTable.status,
        video_url: clipsTable.video_url,
        thumbnail_url: clipsTable.thumbnail_url,
      });

    if (!updatedClip) {
      throw new Error("Failed to update clip in database.");
    }

    console.log(`Clip ${clipId} updated successfully.`);

    return NextResponse.json({ ...updatedClip });
  } catch (error) {
    console.error(`Error processing PATCH request for clip ${clipId}:`, error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update clip" },
      { status: 500 },
    );
  }
}
