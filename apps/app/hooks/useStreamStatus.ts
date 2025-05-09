import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { usePrivy } from "@/hooks/usePrivy";

const BASE_POLLING_INTERVAL = 5000;

export enum StreamStatus {
  Online = "ONLINE",
  Offline = "OFFLINE",
  DegradedInference = "DEGRADED_INFERENCE",
  DegradedInput = "DEGRADED_INPUT",
  Unknown = "UNKNOWN",
}

export const useStreamStatus = (
  streamId?: string,
  requireUser: boolean = true,
) => {
  const { ready, user } = usePrivy();
  const [maxStatusLevel, setMaxStatusLevel] = useState(0);
  const orchestratorFailureCountRef = useRef(0);
  const searchParams = useSearchParams();

  const shouldFetch = ready && (!requireUser || !!user) && !!streamId;

  const getUrl = () => {
    if (!shouldFetch) return null;
    return searchParams.get("gateway")
      ? `/api/streams/${streamId}/status?gateway=${searchParams.get("gateway")}`
      : `/api/streams/${streamId}/status`;
  };

  const fetcher = async (url: string) => {
    const res = await fetch(url, {
      headers: {
        "cache-control": "no-cache",
        pragma: "no-cache",
      },
    });

    if (!res.ok) {
      throw new Error(
        `Failed to fetch stream status: ${res.status} ${res.statusText}`,
      );
    }

    const { success, error, data } = await res.json();
    if (!success || !data) {
      throw new Error(error ?? "No stream data returned from API");
    }

    return data;
  };

  const { data: fullResponse, error } = useSWR(getUrl, fetcher, {
    refreshInterval: BASE_POLLING_INTERVAL,
    dedupingInterval: 1000,
    revalidateOnFocus: true,
    onSuccess: (data: any) => {
      if (
        data?.gateway_status?.last_error?.startsWith(
          "no orchestrators available within",
        )
      ) {
        orchestratorFailureCountRef.current += 1;
      } else {
        orchestratorFailureCountRef.current = 0;
      }
    },
  });

  const status = fullResponse?.state || StreamStatus.Unknown;
  const loading = !error && !fullResponse;
  const capacityReached = orchestratorFailureCountRef.current >= 5;

  const live =
    [
      StreamStatus.Online,
      StreamStatus.DegradedInference,
      StreamStatus.DegradedInput,
    ].includes(status as StreamStatus) &&
    fullResponse?.inference_status?.fps > 0;

  useEffect(() => {
    let currentLevel = 0;
    if (status === StreamStatus.Offline) {
      currentLevel = 1;
    } else if (
      status === StreamStatus.DegradedInput &&
      fullResponse?.inference_status?.fps === 0
    ) {
      currentLevel = 2;
    } else if (
      (status === StreamStatus.Online ||
        status === StreamStatus.DegradedInference) &&
      fullResponse?.inference_status?.fps === 0
    ) {
      currentLevel = 3;
    }
    if (currentLevel > maxStatusLevel) {
      setMaxStatusLevel(currentLevel);
    }
  }, [status, fullResponse, maxStatusLevel]);

  const getStatusMessage = () => {
    switch (maxStatusLevel) {
      case 1:
        return "Initializing stream...";
      case 2:
        return "Your stream has started. Hang tight while we load it...";
      case 3:
        return "Almost there...";
      default:
        return "";
    }
  };

  return {
    status,
    fullResponse,
    loading,
    error: error?.message || null,
    live,
    statusMessage: getStatusMessage(),
    capacityReached,
  };
};
