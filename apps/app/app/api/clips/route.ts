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
import { and, asc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mime from "mime-types";
import { Readable } from "stream";
import {
  ReadableStream as WebReadableStream,
  TransformStream,
} from "stream/web";
import { S3Client } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Clip } from "@prisma/client";

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

interface FileInfo {
  type: string;
  stream: WebReadableStream<Uint8Array>;
}

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
      remix_count: sql<number>`(
            SELECT count(*)
            FROM ${clipsTable} AS derived_clips
            WHERE derived_clips.source_clip_id = ${clipsTable.id}
          )`.mapWith(Number),
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
  sourceClipUrl: z.string(),
  watermarkedClipUrl: z.string(),
  thumbnailUrl: z.string(),
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
    const title = formData.get("title") as string | null;
    const prompt = (formData.get("prompt") as string) || "";
    const sourceClipId = formData.get("sourceClipId")
      ? Number(formData.get("sourceClipId"))
      : null;
    const isFeatured = formData.get("isFeatured") === "true";
    const sourceClipUrl = formData.get("sourceClipUrl") as string;
    const watermarkedClipUrl = formData.get("watermarkedClipUrl") as string;
    const thumbnailUrl = formData.get("thumbnailUrl") as string;

    if (!sourceClipUrl || !watermarkedClipUrl || !thumbnailUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = ClipUploadSchema.safeParse({
      title,
      prompt,
      sourceClipId,
      isFeatured,
      sourceClipUrl,
      watermarkedClipUrl,
      thumbnailUrl,
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
          video_url: watermarkedClipUrl,
          video_title: title || null,
          thumbnail_url: thumbnailUrl,
          author_user_id: userId,
          source_clip_id: sourceClipId || null,
          prompt: prompt,
          status: "completed",
          approval_status: isFeatured ? "pending" : "none",
        })
        .returning({ id: clipsTable.id });

      const generatedSlug = generateSlug();
      await tx.insert(clipSlugsTable).values({
        slug: generatedSlug,
        clip_id: newClip.id,
      });

      return { initialClipId: newClip.id, slug: generatedSlug };
    });

    return NextResponse.json({
      success: true,
      clip: {
        id: initialClipId,
        videoUrl: watermarkedClipUrl,
        thumbnailUrl: thumbnailUrl,
        title: title,
        slug: slug,
        status: "completed",
      },
    });
  } catch (error) {
    console.error("Error processing clip upload:", error);

    if (clipId) {
      try {
        await db
          .update(clipsTable)
          .set({ status: "failed" })
          .where(eq(clipsTable.id, clipId));
      } catch (dbError) {
        console.error("Failed to update clip status:", dbError);
      }
    }

    return NextResponse.json(
      { error: "Failed to process clip upload" },
      { status: 500 },
    );
  }
}
