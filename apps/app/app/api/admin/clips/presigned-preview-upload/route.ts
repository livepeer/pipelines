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

    // Extract the full path from the video URL to maintain directory structure
    const originalUrl = originalClip.video_url;

    // Parse the full URL to get the path portion
    const urlObj = new URL(originalUrl);
    const pathParts = urlObj.pathname.split("/");

    // Remove the first empty string and bucket name from path parts if present
    const meaningfulPathParts = pathParts.filter(
      part => part && !part.includes("livepeer-clips"),
    );

    // Get the last part which is the filename
    const originalFilename =
      meaningfulPathParts[meaningfulPathParts.length - 1];

    // Keep the directory structure (all parts except the filename)
    const directoryPath = meaningfulPathParts.slice(0, -1).join("/");

    const extensionIndex = originalFilename.lastIndexOf(".");
    if (extensionIndex === -1) {
      return NextResponse.json(
        { error: "Original clip filename has no extension" },
        { status: 400 },
      );
    }

    const baseName = originalFilename.substring(0, extensionIndex);
    const extension = originalFilename.substring(extensionIndex);

    // Build the preview file path preserving the original directory structure
    const previewFilePath = directoryPath
      ? `${directoryPath}/${baseName}-short${extension}`
      : `${baseName}-short${extension}`;

    const contentType = "video/mp4";

    // Use the centralized GCP storage functions
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
      makePublicAfterUpload: true,
    });
  } catch (error) {
    console.error("Error generating presigned URL for preview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResponse = await requireAdminAuth(req);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    const { filePath } = await req.json();

    if (!filePath) {
      return NextResponse.json(
        { error: "filePath is required" },
        { status: 400 },
      );
    }

    const { Storage } = await import("@google-cloud/storage");
    const { gcpConfig } = await import("@/lib/serverEnv");

    let storage;
    try {
      if (gcpConfig.credentials) {
        const credentials = JSON.parse(gcpConfig.credentials);
        storage = new Storage({ credentials });
      } else {
        storage = new Storage();
      }
    } catch (error) {
      console.error("Failed to initialize GCP Storage:", error);
      throw new Error("Failed to initialize GCP Storage");
    }

    const bucketName = gcpConfig.bucketName || "daydream-clips";
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    await file.makePublic();

    const publicUrl = getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      publicUrl,
    });
  } catch (error) {
    console.error("Error making file public:", error);
    return NextResponse.json(
      { error: "Failed to make file public" },
      { status: 500 },
    );
  }
}
