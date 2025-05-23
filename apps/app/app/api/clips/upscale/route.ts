import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { upscaleJobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  let jobId: string | undefined;

  try {
    const { clipUrl, email } = await req.json();
    console.log("Received request with:", { clipUrl, email });

    if (!clipUrl || !email) {
      console.log("Missing required fields:", { clipUrl, email });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create a new job record
    jobId = nanoid();
    console.log("Creating job with ID:", jobId);
    try {
      await db.insert(upscaleJobs).values({
        id: jobId,
        status: "processing",
        clipUrl,
      });
      console.log("Successfully created job record");
    } catch (dbError) {
      console.error("Database error creating job:", dbError);
      throw dbError;
    }

    // Call Runway API for video upscaling
    console.log("Calling Runway API...");
    const response = await fetch("https://api.runwayml.com/v1/video-to-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
      },
      body: JSON.stringify({
        input_video: clipUrl,
        model: "gen-3-alpha", // Using Gen-3 Alpha for high quality
        prompt:
          "Upscale this video to 4K quality while maintaining the original content and style",
        negative_prompt: "blurry, low quality, distorted",
        num_frames: 24, // Standard frame rate
        guidance_scale: 7.5, // Balanced between creativity and faithfulness
        num_inference_steps: 50, // Higher steps for better quality
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Runway API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`Failed to upscale video: ${response.statusText}`);
    }

    const { output_video: upscaledUrl } = await response.json();
    console.log("Received upscaled URL:", upscaledUrl);

    // Update job with upscaled URL and mark as completed
    try {
      await db
        .update(upscaleJobs)
        .set({
          status: "completed",
          upscaledUrl,
        })
        .where(eq(upscaleJobs.id, jobId));
      console.log("Successfully updated job with upscaled URL");
    } catch (dbError) {
      console.error("Database error updating job:", dbError);
      throw dbError;
    }

    // Send email to user with both original and upscaled versions
    try {
      await sendEmail({
        to: email,
        subject: "Your upscaled video is ready!",
        html: `
          <h1>Your upscaled video is ready!</h1>
          <p>Here are your videos:</p>
          <p>Original video: <a href="${clipUrl}">Download</a></p>
          <p>Upscaled video: <a href="${upscaledUrl}">Download</a></p>
        `,
      });
      console.log("Successfully sent email");
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in upscale endpoint:", error);

    // Update job status to failed if we have a jobId
    if (jobId) {
      try {
        await db
          .update(upscaleJobs)
          .set({
            status: "failed",
            error: error.message,
          })
          .where(eq(upscaleJobs.id, jobId));
        console.log("Successfully updated job status to failed");
      } catch (dbError) {
        console.error("Error updating job status to failed:", dbError);
      }
    }

    return NextResponse.json(
      { error: "Failed to process upscale request" },
      { status: 500 },
    );
  }
}
