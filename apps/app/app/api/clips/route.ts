import {
  deleteSourceClipIdFromCookies,
  getSourceClipIdFromCookies,
} from "@/components/daydream/Clipping/actions";
import { getPrivyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  clipSlugs as clipSlugsTable,
  clips as clipsTable,
  users as usersTable,
} from "@/lib/db/schema";
import { gcpConfig } from "@/lib/serverEnv";
import {
  buildFilePath,
  generatePresignedUploadUrl,
  getPublicUrl,
} from "@/lib/storage/gcp";
import { Storage } from "@google-cloud/storage";
import { and, asc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Initialize GCP Storage
let storage: Storage;
try {
  if (gcpConfig.credentials) {
    const credentials = JSON.parse(gcpConfig.credentials);
    storage = new Storage({ credentials });
  } else {
    storage = new Storage();
  }
} catch (error) {
  console.error("Failed to initialize GCP Storage in API route:", error);
}

const bucketName = gcpConfig.bucketName || "daydream-clips";

// Function to make a file public
async function makeFilePublic(filePath: string): Promise<boolean> {
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    await file.makePublic();
    return true;
  } catch (error) {
    console.error(`Failed to make file ${filePath} public:`, error);
    return false;
  }
}

type FetchedClip = {
  id: number;
  video_url: string;
  video_title: string | null;
  created_at: Date;
  author_name: string | null;
  remix_count: number;
  slug: string | null;
  priority: number | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || "0");
  const limit = Number(searchParams.get("limit") || "12");

  if (limit > 100 || limit <= 0) {
    return NextResponse.json(
      {
        error: "Limit must be between 1 and 100",
      },
      { status: 400 },
    );
  }

  if (page < 0) {
    return NextResponse.json(
      { error: "Page cannot be negative" },
      { status: 400 },
    );
  }

  const offset = page * limit;

  try {
    const selectFields = {
      id: clipsTable.id,
      video_url: clipsTable.video_url,
      video_title: clipsTable.video_title,
      created_at: clipsTable.created_at,
      author_name: usersTable.name,
      prompt: clipsTable.prompt,
      remix_count: clipsTable.remix_count,
      slug: clipSlugsTable.slug,
      priority: clipsTable.priority,
      is_tutorial: clipsTable.is_tutorial,
    };

    const prioritizedClips = (await db
      .select(selectFields)
      .from(clipsTable)
      .innerJoin(usersTable, eq(clipsTable.author_user_id, usersTable.id))
      .leftJoin(clipSlugsTable, eq(clipsTable.id, clipSlugsTable.clip_id))
      .where(
        and(
          isNull(clipsTable.deleted_at),
          isNotNull(clipsTable.priority),
          eq(clipsTable.status, "completed"),
          eq(clipsTable.approval_status, "approved"),
        ),
      )
      .orderBy(asc(clipsTable.priority))) as FetchedClip[];

    const nonPrioritizedClips = (await db
      .select(selectFields)
      .from(clipsTable)
      .innerJoin(usersTable, eq(clipsTable.author_user_id, usersTable.id))
      .leftJoin(clipSlugsTable, eq(clipsTable.id, clipSlugsTable.clip_id))
      .where(
        and(
          isNull(clipsTable.deleted_at),
          isNull(clipsTable.priority),
          eq(clipsTable.status, "completed"),
          eq(clipsTable.approval_status, "approved"),
        ),
      )
      .orderBy(asc(clipsTable.created_at))) as FetchedClip[];

    const finalClips: (FetchedClip | null)[] = [];
    const priorityMap = new Map<number, FetchedClip>();
    let maxPriority = 0;

    for (const clip of prioritizedClips) {
      if (clip.priority !== null && clip.priority > 0) {
        const position = clip.priority;
        if (position > maxPriority) {
          maxPriority = position;
        }
        if (priorityMap.has(position)) {
          console.warn(
            `Duplicate priority ${position} found for clips ${priorityMap.get(position)?.id} and ${clip.id}. Using clip ${clip.id}.`,
          );
        }
        priorityMap.set(position, clip);
      } else {
        console.warn(
          `Clip ${clip.id} has invalid priority: ${clip.priority}. Ignoring priority.`,
        );
        nonPrioritizedClips.push(clip);
        nonPrioritizedClips.sort(
          (a, b) => a.created_at.getTime() - b.created_at.getTime(),
        );
      }
    }

    const initialLength = Math.max(
      maxPriority,
      nonPrioritizedClips.length + priorityMap.size,
    );
    for (let i = 0; i < initialLength; i++) {
      finalClips[i] = null;
    }

    for (const [position, clip] of priorityMap.entries()) {
      if (position - 1 >= 0) {
        if (position - 1 >= finalClips.length) {
          for (let k = finalClips.length; k <= position - 1; k++) {
            finalClips[k] = null;
          }
        }
        finalClips[position - 1] = clip;
      }
    }

    let nonPrioritizedIndex = 0;
    for (
      let i = 0;
      i < finalClips.length && nonPrioritizedIndex < nonPrioritizedClips.length;
      i++
    ) {
      if (finalClips[i] === null) {
        finalClips[i] = nonPrioritizedClips[nonPrioritizedIndex++];
      }
    }

    while (nonPrioritizedIndex < nonPrioritizedClips.length) {
      finalClips.push(nonPrioritizedClips[nonPrioritizedIndex++]);
    }

    const finalNonNullClips = finalClips.filter(
      clip => clip !== null,
    ) as FetchedClip[];

    const paginatedClips = finalNonNullClips.slice(offset, offset + limit);

    const totalClips = finalNonNullClips.length;
    const hasMore = offset + limit < totalClips;

    return NextResponse.json({
      clips: paginatedClips,
      hasMore,
    });
  } catch (error) {
    console.error("Failed to fetch clips:", error);
    return NextResponse.json(
      { error: "Failed to fetch clips" },
      { status: 500 },
    );
  }
}

const generateSlug = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  6,
);

const ClipUploadSchema = z.object({
  title: z.string().nullable().optional(),
  prompt: z.string().nullable().optional(),
  sourceClipId: z.number().nullable().optional(),
  isFeatured: z.boolean().optional(),
  filename: z.string(),
  contentType: z.string(),
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

    const jsonData = await request.json();

    const result = ClipUploadSchema.safeParse(jsonData);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 },
      );
    }

    const { prompt, isFeatured, filename, contentType } = jsonData;

    const remixedClipId = await getSourceClipIdFromCookies();

    const { clipId, slug } = await db.transaction(async tx => {
      const [newClip] = await tx
        .insert(clipsTable)
        .values({
          video_url: "",
          video_title: null,
          thumbnail_url: "",
          author_user_id: userId,
          source_clip_id: remixedClipId ? Number(remixedClipId) : null,
          prompt: prompt || "",
          status: "uploading",
          approval_status: isFeatured ? "pending" : "none",
        })
        .returning({ id: clipsTable.id });

      const generatedSlug = generateSlug();
      await tx.insert(clipSlugsTable).values({
        slug: generatedSlug,
        clip_id: newClip.id,
      });

      if (remixedClipId) {
        await tx
          .update(clipsTable)
          .set({
            remix_count: sql`remix_count + 1`,
          })
          .where(eq(clipsTable.id, Number(remixedClipId)));
      } else {
        console.warn(`No source clip id found for clipId ${remixedClipId}`);
      }

      return { clipId: newClip.id, slug: generatedSlug };
    });

    const videoPath = buildFilePath(userId, clipId, filename || "clip.mp4");
    const videoUploadUrl = await generatePresignedUploadUrl(
      videoPath,
      contentType,
    );

    const thumbnailPath = buildFilePath(userId, clipId, "thumbnail.jpg");
    const thumbnailUploadUrl = await generatePresignedUploadUrl(
      thumbnailPath,
      "image/jpeg",
    );

    await deleteSourceClipIdFromCookies();

    return NextResponse.json({
      id: clipId,
      videoUrl: encodeURI(getPublicUrl(videoPath)),
      thumbnailUrl: encodeURI(getPublicUrl(thumbnailPath)),
      slug,
      status: "uploading",
      videoUploadUrl,
      thumbnailUploadUrl,
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
