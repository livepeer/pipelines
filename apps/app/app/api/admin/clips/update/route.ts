import { NextResponse } from "next/server";
import { db, withDbClient } from "@/lib/db";
import {
  clips as clipsTable,
  clipSlugs as clipSlugsTable,
} from "@/lib/db/schema";
import { requireAdminAuth } from "@/app/api/admin/auth";
import { eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";

const generateSlug = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  10,
);

export async function PUT(request: Request) {
  let operationType: "create" | "update" = "update";
  let clipIdProvided: number | null = null;

  try {
    const authResponse = await requireAdminAuth(request);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    const body = await request.json();
    const { id, ...updateValues } = body;
    clipIdProvided = id;

    if (id === undefined || id === null) {
      return NextResponse.json(
        { error: "Clip ID is required" },
        { status: 400 },
      );
    }

    // Process numeric fields to make sure they're correctly typed
    const processedUpdateValues = { ...updateValues };
    
    // Convert 'priority' to a proper number or null
    if ('priority' in processedUpdateValues) {
      if (processedUpdateValues.priority === '' || processedUpdateValues.priority === null || processedUpdateValues.priority === undefined) {
        processedUpdateValues.priority = null;
      } else {
        processedUpdateValues.priority = Number(processedUpdateValues.priority);
      }
    }
    
    // Same for 'source_clip_id'
    if ('source_clip_id' in processedUpdateValues) {
      if (processedUpdateValues.source_clip_id === '' || processedUpdateValues.source_clip_id === null || processedUpdateValues.source_clip_id === undefined) {
        processedUpdateValues.source_clip_id = null;
      } else {
        processedUpdateValues.source_clip_id = Number(processedUpdateValues.source_clip_id);
      }
    }

    console.log("Original update values:", updateValues);
    console.log("Processed update values:", processedUpdateValues);

    operationType = id === 0 ? "create" : "update";

    // Use withDbClient to ensure transaction is properly committed and connection closed
    const result = await withDbClient(async (dbClient) => {
      return await dbClient.transaction(async tx => {
        let finalClipData: typeof clipsTable.$inferSelect | null = null;
        let finalSlug: string | null = null;

        if (id === 0) {
          const [newClip] = await tx
            .insert(clipsTable)
            .values(processedUpdateValues)
            .returning();

          if (!newClip) {
            throw new Error("Failed to create clip entry.");
          }

          const slug = generateSlug();

          await tx.insert(clipSlugsTable).values({
            slug,
            clip_id: newClip.id,
          });

          finalClipData = newClip;
          finalSlug = slug;
        } else {
          const [updatedClip] = await tx
            .update(clipsTable)
            .set(processedUpdateValues)
            .where(eq(clipsTable.id, id))
            .returning();

          if (!updatedClip) {
            return { status: 404, error: "Clip not found" };
          }

          console.log("Updated clip in database:", updatedClip);
          console.log("Fields updated:", Object.keys(processedUpdateValues));

          finalClipData = updatedClip;

          const existingSlugResult = await tx
            .select({ slug: clipSlugsTable.slug })
            .from(clipSlugsTable)
            .where(eq(clipSlugsTable.clip_id, id))
            .limit(1);

          finalSlug = existingSlugResult[0]?.slug;

          if (!finalSlug) {
            finalSlug = generateSlug();

            await tx.insert(clipSlugsTable).values({
              slug: finalSlug,
              clip_id: id,
            });
          }
        }

        return { status: 200, clip: finalClipData, slug: finalSlug };
      });
    });

    if (result.status === 404) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    const message =
      id === 0 ? "Clip created successfully" : "Clip updated successfully";
    return NextResponse.json({
      message: message,
      clip: result.clip ? { ...result.clip, slug: result.slug } : null,
    });
  } catch (error: any) {
    console.error(
      `Failed to ${operationType} clip (ID: ${clipIdProvided}):`,
      error,
    );

    return NextResponse.json(
      { error: `Failed to ${operationType} clip` },
      { status: 500 },
    );
  }
}
