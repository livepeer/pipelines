import { createServerClient } from "@repo/supabase";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "../../auth";

export async function DELETE(request: NextRequest) {
  const authResponse = await requireAdminAuth(request);

  if (authResponse.status !== 200) {
    return authResponse;
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Pipeline ID is required" },
        { status: 400 },
      );
    }

    const supabase = await createServerClient();
    const { error } = await supabase.from("pipelines").delete().eq("id", id);

    if (error) {
      console.error("Error deleting pipeline:", error);
      return NextResponse.json(
        { error: "Failed to delete pipeline" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in admin/pipelines/delete API:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
