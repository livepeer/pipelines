import { NextResponse } from "next/server";
import { mixpanel } from "@/lib/env";
import type { Mixpanel } from "mixpanel";
const MixpanelLib = require("mixpanel");

let mixpanelClient: Mixpanel | null = null;
if (mixpanel.projectToken) {
  mixpanelClient = MixpanelLib.init(mixpanel.projectToken);
}

export async function POST(request: Request) {
  console.log("=== MIXPANEL IDENTIFY ROUTE CALLED ===");
  console.log("Headers:", Object.fromEntries(request.headers.entries()));
  
  if (!mixpanelClient) {
    console.log("No mixpanel client configured");
    return NextResponse.json(
      { error: "Mixpanel not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    console.log("Request body:", body);
    const { userId, anonymousId, properties } = body;
    const { first_time_properties, ...regularProperties } = properties;
    console.log("mixpanel identify request", userId, anonymousId, properties);
    // Create alias if needed
    if (anonymousId !== userId) {
      mixpanelClient.alias(userId, anonymousId);
    }

    // Track identify event
	console.log("mixpanelClient.track('$identify', { distinct_id: userId, ...regularProperties })");
    mixpanelClient.track('$identify', {
      distinct_id: userId,
      ...regularProperties
    });

    // Set regular properties
    mixpanelClient.people.set(userId, regularProperties);

    // Set first-time properties that should only be set once
    if (first_time_properties) {
      mixpanelClient.people.set_once(userId, first_time_properties);
    }

    return NextResponse.json({ status: "User identified successfully" });
  } catch (error) {
    console.error("Error identifying user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
} 