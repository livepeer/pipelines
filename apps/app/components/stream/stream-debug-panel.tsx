import { Button } from "@repo/design-system/components/ui/button";
import { Copy } from "lucide-react";
import { StreamStatus, useStreamStatus } from "@/hooks/useStreamStatus";
import { useState, useEffect, useMemo } from "react";
import { useDreamshaperStore } from "@/hooks/useDreamshaper";
import { usePrivy } from "@privy-io/react-auth";
import useFullscreenStore from "@/hooks/useFullscreenStore";
import { cn } from "@repo/design-system/lib/utils";

interface ErrorHistoryItem {
  source: string;
  error: string;
  time: number;
}

export const StreamDebugPanel = () => {
  const [errorHistory, setErrorHistory] = useState<ErrorHistoryItem[]>([]);
  const [debugOpen, setDebugOpen] = useState(false);
  const { stream, pipeline, updating, loading, sharedPrompt } =
    useDreamshaperStore();

  const { fullResponse } = useStreamStatus(stream?.id, false);
  const { user } = usePrivy();

  useEffect(() => {
    if (fullResponse) {
      const newErrors: ErrorHistoryItem[] = [];
      if (
        fullResponse.inference_status &&
        fullResponse.inference_status.last_error
      ) {
        newErrors.push({
          source: "inference_status",
          error: fullResponse.inference_status.last_error,
          time: fullResponse.inference_status.last_error_time,
        });
      }
      if (fullResponse.gateway_status?.last_error) {
        newErrors.push({
          source: "gateway",
          error: fullResponse.gateway_status.last_error,
          time: fullResponse.gateway_status.last_error_time,
        });
      }
      if (newErrors.length > 0) {
        setErrorHistory(prev => {
          const updated = [...prev];
          newErrors.forEach(ne => {
            if (!prev.some(e => e.error === ne.error && e.time === ne.time)) {
              updated.push(ne);
            }
          });
          return updated;
        });
      }
    }
  }, [fullResponse]);

  const getStatusClass = (currentStatus: string | null): string => {
    switch (currentStatus) {
      case StreamStatus.Offline:
        return "bg-red-500 text-white";
      case StreamStatus.DegradedInput:
        return "bg-yellow-500 text-black";
      case StreamStatus.DegradedInference:
        return "bg-orange-500 text-white";
      case StreamStatus.Online:
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const handleCopyLogs = () => {
    const logs = JSON.stringify(fullResponse, null, 2);
    navigator.clipboard.writeText(logs);
  };

  const isAdmin = useMemo(
    () => user?.email?.address?.endsWith("@livepeer.org"),
    [user],
  );

  const { isFullscreen } = useFullscreenStore();

  return (
    <>
      <div
        className={cn(
          "mx-auto flex items-center justify-center gap-4 text-xs capitalize text-muted-foreground mt-2 mb-4",
          isFullscreen && "hidden",
        )}
      >
        {user?.email?.address?.endsWith("@livepeer.org") && (
          <>
            <button
              onClick={() => setDebugOpen(!debugOpen)}
              className="hover:text-muted-foreground/80"
            >
              Debug Panel
            </button>
          </>
        )}
      </div>
      {isAdmin && debugOpen && (
        <div
          className="fixed top-0 right-0 h-full w-96 bg-gray-800/80 text-white p-4 shadow-lg z-50 flex flex-col"
          style={{ fontFamily: "Courier, monospace" }}
        >
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold font-mono">Debug Status</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyLogs}>
                <Copy className="mr-2" />{" "}
                <span className="font-mono">Copy Logs</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDebugOpen(false)}
              >
                <span className="font-mono">Close</span>
              </Button>
            </div>
          </div>
          <p className="mb-4 mt-2 text-xs font-mono">
            <strong>Stream ID :</strong>{" "}
            <code className="text-xs bg-gray-700 p-1 rounded-md font-mono">
              {stream?.id || "N/A"}
            </code>{" "}
            <br />
            <strong>Stream Key:</strong>{" "}
            <code className="text-xs bg-gray-700 p-1 rounded-md font-mono">
              {stream?.stream_key || "N/A"}
            </code>
          </p>
          <div className="mb-2 font-mono">
            <span className="mr-2 font-semibold">State:</span>
            <span
              className={`inline-block rounded px-2 py-1 text-xs font-bold font-mono ${getStatusClass(status)}`}
            >
              {status || "Unknown"}
            </span>
          </div>
          <div className="mt-2 flex-1">
            <div className="h-full flex flex-col">
              <div
                style={{ height: "50vh" }}
                className="h-1/2 overflow-y-auto border-b border-gray-600 pr-2"
              >
                <h3 className="text-sm font-semibold mb-1 font-mono">
                  Full Status
                </h3>
                <pre className="text-xs whitespace-pre-wrap font-mono bg-gray-700 p-2 rounded-md">
                  {fullResponse && Object.keys(fullResponse).length > 0
                    ? JSON.stringify(fullResponse, null, 2)
                    : "Loading..."}
                </pre>
              </div>
              <div className="h-1/2 overflow-y-auto pt-2 pr-2">
                <h3 className="text-sm font-semibold mb-1 font-mono">
                  Error History
                </h3>
                {errorHistory.length > 0 ? (
                  errorHistory.map((err, index) => (
                    <div key={index} className="mb-2 font-mono">
                      <div className="text-xs font-bold">
                        {new Date(err.time).toLocaleString()}
                      </div>
                      <div className="text-xs break-all">{err.error}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-mono">No errors recorded</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
