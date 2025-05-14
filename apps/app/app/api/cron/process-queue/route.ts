import { NextResponse } from "next/server";
import { checkAndProcessQueue } from "../../prompts/store";
import { getPromptState as dbGetPromptState } from "../../../../lib/db/services/prompt-queue";

export async function GET() {
  try {
    const stateBefore = await dbGetPromptState();
    const queueLengthBefore = stateBefore.promptQueue.length;

    await checkAndProcessQueue();

    const stateAfter = await dbGetPromptState();

    return NextResponse.json({
      success: true,
      message: "Queue processed successfully",
      queueStats: {
        before: queueLengthBefore,
        after: stateAfter.promptQueue.length,
        processed: Math.max(
          0,
          queueLengthBefore - stateAfter.promptQueue.length,
        ),
      },
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
