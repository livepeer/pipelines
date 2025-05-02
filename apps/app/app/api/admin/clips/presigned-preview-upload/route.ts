import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

// @ts-ignore - Linter path resolution issue
import { verifyPrivyToken } from "@/lib/privy";
// @ts-ignore - Linter path resolution issue
import { db } from "@/lib/drizzle";
// @ts-ignore - Linter path resolution issue
import { clips } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";
// @ts-ignore - Linter path resolution issue
import { isAdminUser } from "@/lib/admin";

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\n/g, "\n"),
  },
});

const bucketName = process.env.GCS_BUCKET_NAME;
if (!bucketName) {
  throw new Error("GCS_BUCKET_NAME environment variable not set.");
}
const bucket = storage.bucket(bucketName);

export async function POST(req: NextRequest) {
  try {
    const privyToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    const privyUserJson = req.headers.get("x-privy-user"); // Get user info from header

    if (!privyToken || !privyUserJson) {
      return NextResponse.json(
        { error: "Authorization required" },
        { status: 401 },
      );
    }

    const privyUser = JSON.parse(privyUserJson);
    const verifiedClaims = await verifyPrivyToken(privyToken);

    if (verifiedClaims.userId !== privyUser.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    if (!isAdminUser(privyUser.email?.address)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { originalClipId } = await req.json();

    if (!originalClipId || typeof originalClipId !== "number") {
      return NextResponse.json(
        { error: "originalClipId (number) is required" },
        { status: 400 },
      );
    }

    const originalClip = await db.query.clips.findFirst({
      where: eq(clips.id, originalClipId),
      columns: { file_path: true },
    });

    if (!originalClip || !originalClip.file_path) {
      return NextResponse.json(
        { error: "Original clip not found or missing file path" },
        { status: 404 },
      );
    }

    const originalPath = originalClip.file_path;
    const extensionIndex = originalPath.lastIndexOf(".");
    if (extensionIndex === -1) {
      return NextResponse.json(
        { error: "Original clip path has no extension" },
        { status: 400 },
      );
    }
    const basePath = originalPath.substring(0, extensionIndex);
    const extension = originalPath.substring(extensionIndex);
    const previewFilePath = `${basePath}-short${extension}`;
    const contentType = "video/mp4";

    const options = {
      version: "v4" as const,
      action: "write" as const,
      expires: Date.now() + 15 * 60 * 1000,
      contentType: contentType,
    };

    const [uploadUrl] = await bucket
      .file(previewFilePath)
      .getSignedUrl(options);

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${previewFilePath}`;

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
