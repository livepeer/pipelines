import { NextResponse } from "next/server";
import { checkAndProcessQueue } from "../../prompts/store";

export async function GET() {
  try {
    await checkAndProcessQueue();

    return NextResponse.json({
      success: true,
      message: "Queue processed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing queue:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error processing queue",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
