import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "../../auth";
import { createServerClient } from "@repo/supabase";
import { newId } from "@/lib/generate-id";

export async function POST(request: NextRequest) {
  const authResponse = await requireAdminAuth(request);

  if (authResponse.status !== 200) {
    return authResponse;
  }

  const userData = await authResponse.json();
  const userId = userData.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "User ID not found" }, { status: 400 });
  }

  try {
    const pipelineData = await request.json();

    const pipelineId = newId("pipeline");

    const now = new Date().toISOString();

    const supabase = await createServerClient();
    const { data: pipeline, error } = await supabase
      .from("pipelines")
      .insert({
        ...pipelineData,
        id: pipelineId,
        created_at: now,
        updated_at: now,
        author: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating pipeline:", error);
      return NextResponse.json(
        { error: "Failed to create pipeline" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      pipeline,
    });
  } catch (err) {
    console.error("Error in pipeline duplication:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
