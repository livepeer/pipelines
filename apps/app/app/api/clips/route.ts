import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clips as clipsTable } from "@/lib/db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || "0");
  const limit = Number(searchParams.get("limit") || "12");
  const offset = page * limit;

  try {
    const clips = await db
      .select()
      .from(clipsTable)
      .orderBy(clipsTable.created_at)
      .limit(limit)
      .offset(offset);

    const nextPageClips = await db
      .select()
      .from(clipsTable)
      .orderBy(clipsTable.created_at)
      .limit(1)
      .offset(offset + limit);

    const hasMore = nextPageClips.length > 0;

    return NextResponse.json({
      clips,
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
