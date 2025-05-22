import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { upscaleJobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  let jobId: string | undefined;
  
  try {
    const { jobId: requestJobId, clipUrl, email } = await req.json();
    jobId = requestJobId;

    if (!jobId || !clipUrl || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update job status to processing
    await db
      .update(upscaleJobs)
      .set({ status: "processing" })
      .where(eq(upscaleJobs.id, jobId));

    // Call Freepik API for upscaling
    const response = await fetch(
      "https://api.freepik.com/v1/ai/image-upscaler",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-freepik-api-key": process.env.FREEPIK_API_KEY!,
        },
        body: JSON.stringify({
          image: clipUrl,
          scale_factor: "4x",
          optimized_for: "standard",
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upscale image");
    }

    const { url: upscaledUrl } = await response.json();

    // Update job with upscaled URL and mark as completed
    await db
      .update(upscaleJobs)
      .set({
        status: "completed",
        upscaledUrl,
      })
      .where(eq(upscaleJobs.id, jobId));

    // Send email to user with both original and upscaled versions
    await sendEmail({
      to: email,
      subject: "Your upscaled clip is ready!",
      html: `
        <h1>Your upscaled clip is ready!</h1>
        <p>Here are your clips:</p>
        <p>Original clip: <a href="${clipUrl}">Download</a></p>
        <p>Upscaled clip: <a href="${upscaledUrl}">Download</a></p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in upscale endpoint:", error);

    // Update job status to failed if we have a jobId
    if (jobId) {
      await db
        .update(upscaleJobs)
        .set({
          status: "failed",
          error: error.message,
        })
        .where(eq(upscaleJobs.id, jobId));
    }

    return NextResponse.json(
      { error: "Failed to process upscale request" },
      { status: 500 }
    );
  }
}
