import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clips as clipsTable } from "@/lib/db/schema";
import { requireAdminAuth } from "@/app/api/admin/auth";
import { eq } from "drizzle-orm";

export async function DELETE(request: Request) {
  try {
    const authResponse = await requireAdminAuth(request);

    if (authResponse.status !== 200) {
      return authResponse;
    }

    const { searchParams } = new URL(request.url);
    const clipId = searchParams.get("id");

    if (!clipId) {
      return NextResponse.json(
        { error: "Clip ID is required" },
        { status: 400 },
      );
    }

    const [updatedClip] = await db
      .update(clipsTable)
      .set({ deleted_at: new Date() })
      .where(eq(clipsTable.id, parseInt(clipId)))
      .returning();

    if (!updatedClip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Clip deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete clip:", error);
    return NextResponse.json(
      { error: "Failed to delete clip" },
      { status: 500 },
    );
  }
}
