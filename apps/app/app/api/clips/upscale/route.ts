import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { upscaleJobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const upscaleRequestSchema = z.object({
  email: z.string().email(),
  clipId: z.string(),
  clipUrl: z.string().url(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, clipId, clipUrl } = upscaleRequestSchema.parse(body);

    // Create a new upscale job in the database
    const [job] = await db
      .insert(upscaleJobs)
      .values({
        clipId,
        clipUrl,
        email,
        status: "pending",
      })
      .returning();

    // Trigger the upscale job in the background
    // This will be handled by a worker
    await fetch(`${process.env.WORKER_BASE_URL}/upscale`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jobId: job.id,
        clipUrl,
        email,
      }),
    });

    return NextResponse.json({ success: true, jobId: job.id });
  } catch (error) {
    console.error("Error creating upscale job:", error);
    return NextResponse.json(
      { error: "Failed to create upscale job" },
      { status: 500 },
    );
  }
}
