import { useEffect, useState } from "react";

export default function PipelineStatus({
  pipelineId,
  streamId,
}: {
  pipelineId: string;
  streamId: string;
}) {
  const [status, setStatus] = useState<string | null>("FETCHING STATUS...");

  useEffect(() => {
    let source: EventSource;
    const fetchSseMessages = async () => {
      source = new EventSource(`/api/streams/${streamId}/sse`);
      source.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setStatus(data.state ?? "PROCESSING");
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

  return <div>{status}</div>;
}
