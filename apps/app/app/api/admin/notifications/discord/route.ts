import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "@/app/api/admin/validate";
import { db } from "@/lib/db";
import { clipSlugs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  // Validate admin privileges
  const validation = await validateAdminRequest(request);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }

  try {
    const { clipId, clipTitle, authorName, thumbnailUrl, videoUrl, prompt } =
      await request.json();

    // Make sure webhookUrl is stored in environment variables
    const webhookUrl = process.env.DISCORD_CLIP_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Discord webhook URL not configured" },
        { status: 500 },
      );
    }

    if (!clipId || !clipTitle) {
      return NextResponse.json(
        { error: "Missing required clip information" },
        { status: 400 },
      );
    }

    // Fetch the slug for this clip ID
    let clipSlug = String(clipId); // Default to using ID as fallback
    try {
      const result = await db
        .select({ slug: clipSlugs.slug })
        .from(clipSlugs)
        .where(eq(clipSlugs.clip_id, parseInt(String(clipId))))
        .limit(1);

      if (result.length > 0) {
        clipSlug = result[0].slug;
      }
    } catch (slugError) {
      console.error("Error fetching slug:", slugError);
      // Continue with ID as fallback
    }

    // Determine the base URL
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    // Create the Discord message
    const message = {
      embeds: [
        {
          title: "New clip by " + authorName,
          description: "**Prompt:** " + "*" + prompt + "*",
          color: 3447003, // Blue color
          image: thumbnailUrl ? { url: thumbnailUrl } : undefined,
          url: `${baseUrl}/clips/${clipSlug}`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // Send to Discord webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Discord webhook error:", errorText);
      return NextResponse.json(
        { error: `Discord API error: ${response.status}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending Discord notification:", error);
    return NextResponse.json(
      { error: "Failed to send Discord notification" },
      { status: 500 },
    );
  }
}
