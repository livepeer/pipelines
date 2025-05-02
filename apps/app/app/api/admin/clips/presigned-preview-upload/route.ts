import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clips as clipsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "@/app/api/admin/auth";
import { generatePresignedUploadUrl, getPublicUrl } from "@/lib/storage/gcp";

export async function POST(req: NextRequest) {
  try {
    // Use the standard admin auth check
    const authResponse = await requireAdminAuth(req);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    const { originalClipId } = await req.json();

    if (!originalClipId || typeof originalClipId !== "number") {
      return NextResponse.json(
        { error: "originalClipId (number) is required" },
        { status: 400 },
      );
    }

    const originalClip = await db
      .select({ video_url: clipsTable.video_url })
      .from(clipsTable)
      .where(eq(clipsTable.id, originalClipId))
      .limit(1)
      .then(rows => rows[0]);

    if (!originalClip || !originalClip.video_url) {
      return NextResponse.json(
        { error: "Original clip not found or missing video URL" },
        { status: 404 },
      );
    }

    // Extract the filename from the video URL to generate the preview path
    const originalUrl = originalClip.video_url;
    const urlParts = originalUrl.split("/");
    const originalFilename = urlParts[urlParts.length - 1];

    const extensionIndex = originalFilename.lastIndexOf(".");
    if (extensionIndex === -1) {
      return NextResponse.json(
        { error: "Original clip filename has no extension" },
        { status: 400 },
      );
    }

    const baseName = originalFilename.substring(0, extensionIndex);
    const extension = originalFilename.substring(extensionIndex);
    const previewFilePath = `${baseName}-short${extension}`;
    const contentType = "video/mp4";

    const uploadUrl = await generatePresignedUploadUrl(
      previewFilePath,
      contentType,
      15,
    );

    const publicUrl = getPublicUrl(previewFilePath);

    console.log(`Generated presigned URL for preview: ${previewFilePath}`);

    return NextResponse.json({
      success: true,
      uploadUrl,
      publicUrl,
      previewFilePath,
    });
  } catch (error) {
    console.error("Error generating presigned URL for preview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
