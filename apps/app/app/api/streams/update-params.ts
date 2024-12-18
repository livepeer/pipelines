"use server";
import { createServerClient } from "@repo/supabase";

export async function updateParams({
  body,
  host,
  streamKey,
}: {
  body: any;
  host: string;
  streamKey: string;
}) {
  console.log("updateParams", body, host);
  const credentials = Buffer.from(
    process.env.USERNAME_PASSWORD as string
  ).toString("base64");

  const response = await fetch(
    `https://${host}/live/video-to-video/${streamKey}/update`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  console.log("response", response);

  const status = response.status;

  return { status };
}
