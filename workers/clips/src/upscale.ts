import { Hono } from "hono";
import { cors } from "hono/cors";
import { db } from "../../../apps/app/lib/db";
import { upscaleJobs } from "../../../apps/app/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../../../apps/app/lib/email";

const app = new Hono();

app.use("*", cors());

interface UpscaleRequest {
  jobId: string;
  clipUrl: string;
  email: string;
}

app.post("/upscale", async (c) => {
  let jobId: string | undefined;
  
  try {
    const { jobId: reqJobId, clipUrl, email } = await c.req.json() as UpscaleRequest;
    jobId = reqJobId;

    // Update job status to processing
    await db
      .update(upscaleJobs)
      .set({ status: "processing" })
      .where(eq(upscaleJobs.id, jobId));

    // Call Freepik API for upscaling
    const response = await fetch("https://api.freepik.com/v1/ai/image-upscaler", {
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
    });

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

    return c.json({ success: true });
  } catch (error: unknown) {
    console.error("Error in upscale worker:", error);

    // Update job status to failed
    if (jobId) {
      await db
        .update(upscaleJobs)
        .set({
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        })
        .where(eq(upscaleJobs.id, jobId));
    }

    return c.json({ error: "Failed to process upscale request" }, 500);
  }
});

export default app; 