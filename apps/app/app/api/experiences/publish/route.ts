import { db } from "@/lib/db";
import { publishedExperiences } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { getOgImage } from "@/lib/og-image";

export async function POST(request: Request) {
  try {
    const { title, description, prompt, image, author_id, share_link } =
      await request.json();

    // Fetch og-image if the image is a URL
    let og_image = null;
    if (image.startsWith("http")) {
      og_image = await getOgImage(image);
    }

    const experience = await db
      .insert(publishedExperiences)
      .values({
        title,
        description,
        prompt,
        image,
        og_image,
        author_id,
        share_link,
      })
      .returning();

    return NextResponse.json(experience[0]);
  } catch (error) {
    console.error("Error publishing experience:", error);
    return NextResponse.json(
      { error: "Failed to publish experience" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const experiences = await db
      .select()
      .from(publishedExperiences)
      .orderBy(publishedExperiences.created_at);
    return NextResponse.json(experiences);
  } catch (error) {
    console.error("Error fetching experiences:", error);
    return NextResponse.json(
      { error: "Failed to fetch experiences" },
      { status: 500 },
    );
  }
}
