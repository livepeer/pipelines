import { getStoredStreamStatus } from "@/app/api/pipelines/validation";

// Prevents this route's response from being cached on Vercel
export const dynamic = "force-dynamic";
export const maxDuration = 30000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const encoder = new TextEncoder();
  const streamId = (await params).id;

  const customReadable = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: {"message": "Connected to SSE stream"}\n\n`)
      );

      let intervalId: NodeJS.Timeout;
      intervalId = setInterval(async () => {
        const status = await getStoredStreamStatus(streamId);

        if (status) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(status)}\n\n`)
          );
        } else {
          controller.enqueue(
            encoder.encode(
              `data: {"message": "Stream status data not available yet or Stream not found"}\n\n`
            )
          );
        }
      }, 5000);

      request.signal.addEventListener("abort", () => {
        console.log("Aborting SSE stream");
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  return new Response(customReadable, {
    headers: {
      Connection: "keep-alive",
      "Content-Encoding": "none",
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
}
