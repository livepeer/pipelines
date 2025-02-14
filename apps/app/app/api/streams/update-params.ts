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
  console.log("updateParams called with:", { body, host, streamKey });

  const url = `${host}/api/stream/${streamKey}/params`;
  console.log("Making request to URL:", url);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("Response status:", response.status);
    console.log("Response:", response);

    return { status: response.status };
  } catch (error) {
    console.error("Error in updateParams:", error);
    throw error;
  }
}
