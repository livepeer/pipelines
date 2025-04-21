import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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

    operationType = id === 0 ? "create" : "update";

    const result = await db.transaction(async tx => {
      let finalClipData: typeof clipsTable.$inferSelect | null = null;
      let finalSlug: string | null = null;

      if (id === 0) {
        const [newClip] = await tx
          .insert(clipsTable)
          .values(updateValues)
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
          .set(updateValues)
          .where(eq(clipsTable.id, id))
          .returning();

        if (!updatedClip) {
          return { status: 404, error: "Clip not found" };
        }

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
