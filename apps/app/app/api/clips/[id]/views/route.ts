import { PrivyClient } from "@privy-io/server-auth";

import { db } from "@/lib/db";
import { clipViews } from "@/lib/db/schema";
import { getAppConfig } from "@/lib/env";
import { NextRequest } from "next/server";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return Response.json({ error: "Clip ID is required" }, { status: 400 });
  }

  try {
    console.log("Got request to log clip view:", id);
    const { sessionId } = await request.json();

    // Parse IP
    const app = getAppConfig(request.nextUrl.searchParams); // To check secondary gateway
    const forwardedFor = request.headers.get("x-forwarded-for");

    const ip =
      app.environment === "dev"
        ? "93.152.210.100" // Hardcoded development IP (truncated ip that resolves to San Francisco)
        : forwardedFor
          ? forwardedFor.split(",")[0].trim()
          : "127.0.0.1";

    // Parse User Id
    const accessToken = request.headers
      .get("Authorization")
      ?.replace(/^Bearer /, "");

    const userId = accessToken
      ? (await privy.verifyAuthToken(accessToken)).userId
      : null;

    // Log the clip view
    await db.insert(clipViews).values({
      clip_id: Number(id),
      session_id: sessionId,
      ...(userId && { user_id: userId }),
      ip_address: ip,
    });

    return Response.json({
      message: "Clip view recorded successfully",
    });
  } catch (error) {
    console.error("Failed to log clip view:", error);
    return Response.json({ error: "Failed to log clip view" }, { status: 500 });
  }
}
