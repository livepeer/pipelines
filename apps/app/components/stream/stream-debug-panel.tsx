import { Button } from "@repo/design-system/components/ui/button";
import { Copy } from "lucide-react";
import { StreamStatus } from "@/hooks/useStreamStatus";
import { useState, useEffect } from "react";

interface StreamDebugPanelProps {
  streamId: string | null;
  status: StreamStatus | null;
  fullResponse: any;
  onClose: () => void;
}

interface ErrorHistoryItem {
  source: string;
  error: string;
  time: number;
}

export function StreamDebugPanel({ 
  streamId, 
  status, 
  fullResponse, 
  onClose 
}: StreamDebugPanelProps) {
  const [errorHistory, setErrorHistory] = useState<ErrorHistoryItem[]>([]);

  useEffect(() => {
    if (fullResponse) {
      const newErrors: ErrorHistoryItem[] = [];
      if (fullResponse.inference_status && fullResponse.inference_status.last_error) {
        newErrors.push({
          source: "inference_status",
          error: fullResponse.inference_status.last_error,
          time: fullResponse.inference_status.last_error_time,
        });
      }
      if (fullResponse.gateway_last_error) {
        newErrors.push({
          source: "gateway",
          error: fullResponse.gateway_last_error,
          time: fullResponse.gateway_last_error_time,
        });
      }
      if (newErrors.length > 0) {
        setErrorHistory((prev) => {
          const updated = [...prev];
          newErrors.forEach((ne) => {
            if (!prev.some((e) => e.error === ne.error && e.time === ne.time)) {
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

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-gray-800/80 text-white p-4 shadow-lg z-50 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Debug Status</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLogs}>
            <Copy className="mr-2" /> Copy Logs
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
      <p>
        <strong>Stream ID:</strong> {streamId || "N/A"}
      </p>
      <div className="mb-2">
        <span className="mr-2 font-semibold">State:</span>
        <span className={`inline-block rounded px-2 py-1 text-xs font-bold ${getStatusClass(status)}`}>
          {status || "Unknown"}
        </span>
      </div>
      <div className="mt-2 flex-1">
        <div className="h-full flex flex-col">
          <div style={{ height: "50vh" }} className="h-1/2 overflow-y-auto border-b border-gray-600 pr-2">
            <h3 className="text-sm font-semibold mb-1">Full Status</h3>
            <pre className="text-xs whitespace-pre-wrap">
              {fullResponse ? JSON.stringify(fullResponse, null, 2) : "Loading..."}
            </pre>
          </div>
          <div className="h-1/2 overflow-y-auto pt-2 pr-2">
            <h3 className="text-sm font-semibold mb-1">Error History</h3>
            {errorHistory.length > 0 ? (
              errorHistory.map((err, index) => (
                <div key={index} className="mb-2">
                  <div className="text-xs font-bold">
                    {new Date(err.time).toLocaleString()}
                  </div>
                  <div className="text-xs break-all">{err.error}</div>
                </div>
              ))
            ) : (
              <p className="text-xs">No errors recorded</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 