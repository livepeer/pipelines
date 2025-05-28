import { NextResponse } from "next/server";
import { checkAndProcessQueue } from "../../prompts/store";
import { getPromptState as dbGetPromptState } from "../../../../lib/db/services/prompt-queue";

const TARGET_STREAM_KEYS =
  (process.env.NEXT_PUBLIC_MULTIPLAYER_STREAM_KEY as string)
    ?.split(",")
    ?.map(key => key.trim())
    ?.filter(key => key.length > 0) || [];

export async function GET() {
  try {
    const results = await Promise.all(
      TARGET_STREAM_KEYS.map(async streamKey => {
        try {
          const stateBefore = await dbGetPromptState(streamKey);
          const queueLengthBefore = stateBefore.promptQueue.length;

          await checkAndProcessQueue(streamKey);

          const stateAfter = await dbGetPromptState(streamKey);

          return {
            streamKey,
            success: true,
            queueStats: {
              before: queueLengthBefore,
              after: stateAfter.promptQueue.length,
              processed: Math.max(
                0,
                queueLengthBefore - stateAfter.promptQueue.length,
              ),
            },
          };
        } catch (error) {
          console.error(
            `Error processing queue for stream ${streamKey}:`,
            error,
          );
          return {
            streamKey,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    );

    const successCount = results.filter(r => r.success).length;
    const totalProcessed = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.queueStats?.processed || 0), 0);

    return NextResponse.json({
      success: true,
      message: `Processed ${successCount}/${TARGET_STREAM_KEYS.length} stream queues successfully`,
      streams: results,
      totalProcessed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing queues:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error processing queues",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
