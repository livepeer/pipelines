import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clips as clipsTable } from "@/lib/db/schema";
import { requireAdminAuth } from "@/app/api/admin/auth";
import { eq } from "drizzle-orm";

export async function PUT(request: Request) {
  try {
    const auth = await requireAdminAuth(request);
    if ("error" in auth) {
      return auth;
    }

    const body = await request.json();
    const { id, ...updateValues } = body;

    if (!id) {
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

      return NextResponse.json({
        message: "Clip created successfully",
        clip: newClip,
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

    return NextResponse.json({
      message: "Clip updated successfully",
      clip: updatedClip,
    });
  } catch (error) {
    console.error("Failed to update clip:", error);
    return NextResponse.json(
      { error: "Failed to update clip" },
      { status: 500 },
    );
  }
}
