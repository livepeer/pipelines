import { NextRequest, NextResponse } from "next/server";
import { getPrivyUser } from "@/lib/auth";
import { Storage } from "@google-cloud/storage";
import { gcpConfig } from "@/lib/serverEnv";

const storage = new Storage({
  credentials: gcpConfig.credentials ? JSON.parse(gcpConfig.credentials) : undefined,
});

const bucketName = gcpConfig.bucketName || "daydream-clips";

export async function POST(request: NextRequest) {
  try {
    const privyUser = await getPrivyUser();
    if (!privyUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename, contentType } = await request.json();
    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Filename and content type are required" },
        { status: 400 }
      );
    }

    const path = `clips/${privyUser.userId}/${Date.now()}/${filename}`;
    const file = storage.bucket(bucketName).file(path);

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
    });

    return NextResponse.json({
      uploadUrl: url,
      publicUrl: `https://storage.googleapis.com/${bucketName}/${path}`,
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
} 