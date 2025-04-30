import { NextResponse } from "next/server";
import { getPrivyUser } from "@/lib/auth";
import { buildClipPath } from "@/lib/storage/gcp";
import { generatePresignedUploadUrl } from "@/lib/storage/gcp";
import { customAlphabet } from "nanoid";

// Generate a random ID for the clip
const generateId = customAlphabet("1234567890", 10);

export async function POST(request: Request) {
  try {
    const privyUser = await getPrivyUser();
    if (!privyUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = privyUser.userId;
    const { contentType, filename } = await request.json();
    
    if (!contentType) {
      return NextResponse.json(
        { error: "Content-Type is required" },
        { status: 400 }
      );
    }
    
    // Generate clip ID
    const clipId = generateId();
    
    // Generate the file path in GCS
    const filePath = buildClipPath(userId, clipId, filename || "clip.mp4");
    
    // Generate presigned URL
    const uploadUrl = await generatePresignedUploadUrl(filePath, contentType);
    
    // Generate thumbnail path if needed (for later reference)
    const thumbnailPath = `clips/${userId}/${clipId}/thumbnail.jpg`;
    
    return NextResponse.json({
      success: true,
      uploadUrl,
      clipId,
      filePath,
      thumbnailPath
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
} 