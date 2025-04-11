import { createServerClient } from "@repo/supabase";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "../auth";

export async function GET(request: NextRequest) {
  const authResponse = await requireAdminAuth(request);

  if (authResponse.status !== 200) {
    return authResponse;
  }

  try {
    const { fileName, contentType } = await request.json();

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "fileName and contentType are required" },
        { status: 400 },
      );
    }

    const timestamp = Date.now();
    const fileExt = fileName.split(".").pop();
    const uniqueFileName = `pipeline-covers/${timestamp}-${fileName.substring(0, 50).replace(/[^a-zA-Z0-9-_]/g, "-")}.${fileExt}`;

    const supabase = await createServerClient();
    const { data, error } = await supabase.storage
      .from("assets")
      .createSignedUploadUrl(uniqueFileName);

    if (error) {
      console.error("Error creating signed URL:", error);
      return NextResponse.json(
        { error: "Failed to create upload URL" },
        { status: 500 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const bucketName = "assets";
    const fileUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${uniqueFileName}`;

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      fileUrl: fileUrl,
    });
  } catch (err) {
    console.error("Error in admin/upload-url API:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
