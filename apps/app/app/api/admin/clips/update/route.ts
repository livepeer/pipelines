import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  clips as clipsTable,
  clipSlugs as clipSlugsTable,
} from "@/lib/db/schema";
import { requireAdminAuth } from "@/app/api/admin/auth";
import { eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";

const generateSlug = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

export async function PUT(request: Request) {
  try {
    const authResponse = await requireAdminAuth(request);

    if (authResponse.status !== 200) {
      return authResponse;
    }

    const body = await request.json();
    const { id, ...updateValues } = body;

    if (id === undefined || id === null) {
      return NextResponse.json(
        { error: "Clip ID is required" },
        { status: 400 },
      );
    }

    if (id === 0) {
      const [newClip] = await db
        .insert(clipsTable)
        .values(updateValues)
        .returning();

      const slug = generateSlug();
      await db.insert(clipSlugsTable).values({
        slug,
        clip_id: newClip.id,
      });

      return NextResponse.json({
        message: "Clip created successfully",
        clip: { ...newClip, slug },
      });
    }

    const [updatedClip] = await db
      .update(clipsTable)
      .set(updateValues)
      .where(eq(clipsTable.id, id))
      .returning();

    if (!updatedClip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    const existingSlug = await db
      .select({ slug: clipSlugsTable.slug })
      .from(clipSlugsTable)
      .where(eq(clipSlugsTable.clip_id, id))
      .limit(1);

    let slug = existingSlug[0]?.slug;

    if (!slug) {
      slug = generateSlug();
      await db.insert(clipSlugsTable).values({
        slug,
        clip_id: id,
      });
    }

    return NextResponse.json({
      message: "Clip updated successfully",
      clip: { ...updatedClip, slug },
    });
  } catch (error) {
    console.error("Failed to update clip:", error);
    return NextResponse.json(
      { error: "Failed to update clip" },
      { status: 500 },
    );
  }
}
