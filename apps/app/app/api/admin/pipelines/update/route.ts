import { createServerClient } from "@repo/supabase";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "../../auth";

export async function PUT(request: NextRequest) {
  const authResult = await requireAdminAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const data = await request.json();
    const { id, author, ...updates } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Pipeline ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const { data: updatedPipeline, error } = await supabase
      .from("pipelines")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating pipeline:", error);
      return NextResponse.json(
        { error: `Failed to update pipeline: ${error.message || error.details || JSON.stringify(error)}` },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedPipeline);
  } catch (err) {
    console.error("Error in admin/pipelines/update API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? `An unexpected error occurred: ${err.message}` : "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 