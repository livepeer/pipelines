import { useEffect, useState } from "react";

const STATUS_CHECK_ENDPOINT =
  "https://livepeerdaydream.statuspage.io/api/v2/status.json";

// Check documentation for more details on API and types: https://livepeerdaydream.statuspage.io/api/v2/
type StatusIndicator = "none" | "minor" | "major" | "critical";

export const useSystemStatus = () => {
  const [status, setStatus] = useState<StatusIndicator | null>(null);

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const response = await fetch(STATUS_CHECK_ENDPOINT);
        const data = await response.json();
        const status = data?.status?.indicator as StatusIndicator;
        setStatus(status);
      } catch (error) {
        console.error("Error fetching system status");
      }
    };
    fetchSystemStatus();
  }, []);

  return status;
};
