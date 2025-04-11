import { createServerClient } from "@repo/supabase";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "../auth";

export async function GET(request: NextRequest) {
  const authResponse = await requireAdminAuth(request);

  if (authResponse.status !== 200) {
    return authResponse;
  }

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("pipelines")
      .select("*, author:users(name)");

    if (error) {
      console.error("Error fetching pipelines:", error);
      return NextResponse.json(
        { error: "Failed to fetch pipelines" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error in admin/pipelines API:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
