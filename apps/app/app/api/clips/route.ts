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
  getPublicUrl,
} from "@/lib/storage/gcp";
import { and, asc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mime from "mime-types";
import {
  deleteSourceClipIdFromCookies,
  getSourceClipIdFromCookies,
} from "@/components/daydream/Clipping/actions";
import { Storage } from "@google-cloud/storage";
import { gcpConfig } from "@/lib/serverEnv";

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
  clipId: z.string().optional(),
  videoUrl: z.string().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  filePath: z.string().optional(),
  thumbnailPath: z.string().optional(),
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

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const jsonData = await request.json();

      const result = ClipUploadSchema.safeParse(jsonData);

      if (!result.success) {
        return NextResponse.json(
          { error: "Invalid request", details: result.error.format() },
          { status: 400 },
        );
      }

      const {
        clipId: externalClipId,
        videoUrl,
        thumbnailUrl,
        prompt,
        isFeatured,
        filePath,
        thumbnailPath,
      } = jsonData;

      if (!externalClipId) {
        return NextResponse.json(
          { error: "Missing required field: clipId" },
          { status: 400 },
        );
      }

      // Make the uploaded files public
      let videoIsPublic = true;
      let thumbnailIsPublic = true;

      // Check if the source clip is a remix from cookies
      const remixedClipId = await getSourceClipIdFromCookies();

      if (filePath) {
        videoIsPublic = await makeFilePublic(filePath);
        if (!videoIsPublic) {
          console.warn(
            `Video file ${filePath} could not be made public, but continuing with request`,
          );
        }
      }

      if (thumbnailPath) {
        thumbnailIsPublic = await makeFilePublic(thumbnailPath);
        if (!thumbnailIsPublic) {
          console.warn(
            `Thumbnail file ${thumbnailPath} could not be made public, but continuing with request`,
          );
        }
      }

      // Make sure we use the full URL with correct bucket name
      let finalVideoUrl = videoUrl;
      if (filePath) {
        // If filePath is provided, use it to generate the correct URL
        finalVideoUrl = getPublicUrl(filePath);
      } else if (videoUrl && !videoUrl.includes("storage.googleapis.com")) {
        // If videoUrl doesn't contain the domain, treat it as a path
        finalVideoUrl = getPublicUrl(videoUrl);
      }

      // Same for thumbnail
      let finalThumbnailUrl = thumbnailUrl;
      if (thumbnailPath) {
        finalThumbnailUrl = getPublicUrl(thumbnailPath);
      } else if (
        thumbnailUrl &&
        !thumbnailUrl.includes("storage.googleapis.com")
      ) {
        finalThumbnailUrl = getPublicUrl(thumbnailUrl);
      }

      const { initialClipId, slug } = await db.transaction(async tx => {
        const [newClip] = await tx
          .insert(clipsTable)
          .values({
            video_url: finalVideoUrl,
            video_title: null,
            thumbnail_url: finalThumbnailUrl || null,
            author_user_id: userId,
            source_clip_id: remixedClipId ? Number(remixedClipId) : null,
            prompt: prompt || null,
            status: "completed",
            approval_status: isFeatured ? "pending" : "approved",
          })
          .returning({ initialClipId: clipsTable.id });

        const slugValue = generateSlug();
        await tx.insert(clipSlugsTable).values({
          clip_id: newClip.initialClipId,
          slug: slugValue,
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

        return { initialClipId: newClip.initialClipId, slug: slugValue };
      });

      clipId = initialClipId;

      // Delete the source clip id from cookies to avoid huge remix counts per clip
      await deleteSourceClipIdFromCookies();

      return NextResponse.json({
        success: true,
        clip: {
          id: clipId,
          videoUrl: finalVideoUrl,
          thumbnailUrl: finalThumbnailUrl,
          slug,
        },
      });
    } else {
      const formData = await request.formData();

      const sourceClip = formData.get("sourceClip") as File | null;
      const watermarkedClip = formData.get("watermarkedClip") as File | null;
      const thumbnail = formData.get("thumbnail") as File | null;

      const title = formData.get("title") as string | null;
      const prompt = (formData.get("prompt") as string) || "";

      const sourceClipId = formData.get("sourceClipId")
        ? Number(formData.get("sourceClipId"))
        : null;

      const isFeatured = formData.get("isFeatured") === "true";

      if (!sourceClip) {
        return NextResponse.json(
          { error: "Invalid request", details: "No clip file provided" },
          { status: 400 },
        );
      }

      // Check if the source clip is a remix from cookies
      const remixedClipId = await getSourceClipIdFromCookies();

      const result = ClipUploadSchema.safeParse({
        title,
        prompt,
        sourceClipId,
        isFeatured,
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
            source_clip_id: remixedClipId
              ? Number(remixedClipId)
              : sourceClipId || null,
            prompt: prompt,
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

        return { initialClipId: newClip.id, slug: generatedSlug };
      });

      clipId = initialClipId;

      const clipBuffer = Buffer.from(await sourceClip.arrayBuffer());
      const fileType = sourceClip.type || "video/mp4";
      const sourceExtension = mime.extension(fileType) || "mp4";
      const clipPath = buildClipPath(
        userId,
        clipId,
        `source-clip.${sourceExtension}`,
      );

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
          const watermarkedExtension =
            mime.extension(watermarkedFileType) || "mp4";
          const watermarkedPath = buildClipPath(
            userId,
            clipId,
            `clip.${watermarkedExtension}`,
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
          const thumbnailExtension = mime.extension(thumbnailFileType) || "jpg";
          const thumbnailPath = buildClipPath(
            userId,
            clipId,
            `thumbnail.${thumbnailExtension}`,
          );
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

      // Delete the source clip id from cookies to avoid huge remix counts per clip
      await deleteSourceClipIdFromCookies();

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
    }
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
