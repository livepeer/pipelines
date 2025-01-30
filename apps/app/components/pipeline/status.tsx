import { Label } from "@repo/design-system/components/ui/label";
import { cn } from "@repo/design-system/lib/utils";
import { useEffect, useState } from "react";

export default function PipelineStatus({
  pipelineId,
  streamId,
}: {
  pipelineId: string;
  streamId: string;
}) {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    let source: EventSource;
    const fetchSseMessages = async () => {
      source = new EventSource(`/api/streams/${streamId}/sse`);
      source.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setData(data);
      };
      source.onerror = (error) => {
        console.error("Error fetching pipeline status:", error);
        source.close();
      };
      setTimeout(() => {
        if (source) {
          source.close();
        }
      }, 60000);
    };
    fetchSseMessages();

    return () => {
      if (source) {
        source.close();
      }
    };
  }, []);

  return (
    <div>
      <div className="flex flex-col space-y-1.5 mt-4">
        <Label className="text-muted-foreground">Status</Label>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              data?.state === "ONLINE" ? "bg-green-500" : "bg-yellow-400"
            )}
          ></div>
          <p className="text-md text-foreground">
            {data?.state || "PROCESSING"}
          </p>
        </div>
      </div>
      <div className="flex flex-col space-y-1.5 mt-4">
        <Label className="text-muted-foreground">Inferred FPS</Label>
        <div className="flex items-center gap-2">
          <p className="text-md text-foreground">
            {data?.inference_status?.fps?.toFixed(2) || "PROCESSING"}
          </p>
        </div>
      </div>
    </div>
  );
}
