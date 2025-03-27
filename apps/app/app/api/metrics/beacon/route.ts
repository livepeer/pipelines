import { NextRequest, NextResponse } from "next/server";
import { sendKafkaEvent } from "../kafka";

// handle beacon API requests
// during page unload events when standard fetch requests might be cancelled
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, data, app, host } = body;
    
    if (!eventType || !data || !app || !host) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await sendKafkaEvent(eventType, data, app, host);
    
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Error processing beacon request:", error);
    return NextResponse.json(
      { error: "Failed to process beacon request" },
      { status: 500 }
    );
  }
} 