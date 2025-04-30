import { NextResponse } from "next/server";
import { getPrivyUser } from "@/lib/auth";
import { generatePresignedUploadUrl } from "@/lib/storage/gcp";

export async function POST(request: Request) {
  try {
    const privyUser = await getPrivyUser();
    if (!privyUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = privyUser.userId;
    const { clipId, contentType = "image/jpeg" } = await request.json();
    
    if (!clipId) {
      return NextResponse.json(
        { error: "Clip ID is required" },
        { status: 400 }
      );
    }
    
    // Generate thumbnail path
    const thumbnailPath = `clips/${userId}/${clipId}/thumbnail.jpg`;
    
    // Generate presigned URL for thumbnail
    const uploadUrl = await generatePresignedUploadUrl(thumbnailPath, contentType);
    
    return NextResponse.json({
      success: true,
      uploadUrl,
      thumbnailPath
    });
  } catch (error) {
    console.error("Error generating thumbnail presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate thumbnail upload URL" },
      { status: 500 }
    );
  }
} 