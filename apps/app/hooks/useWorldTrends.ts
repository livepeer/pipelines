"use client";

import { useCallback } from "react";
import { useFetch } from "./useFetch";

export interface Trend {
  trend: string;
}

interface TrendsResponse {
  trends: Trend[];
}

export function useWorldTrends() {
  const fetchTrends = useCallback(async (): Promise<TrendsResponse> => {
    const fallbackData: TrendsResponse = {
      trends: [
        { trend: "GTA 6" },
        { trend: "Ed Martin" },
        { trend: "Vice City" },
        { trend: "Carney" },
        { trend: "Rockstar" },
        { trend: "Houthis" },
        { trend: "Tillis" },
        { trend: "Antifa" },
        { trend: "Boasberg" },
        { trend: "Primary" },
        { trend: "Never Say Never" },
        { trend: "GTA VI" },
        { trend: "Lucia" },
        { trend: "RINO" },
        { trend: "Bennett" },
        { trend: "Gulf of Mexico" },
        { trend: "Real ID" },
        { trend: "Merrick Garland" },
        { trend: "Taco Tuesday" },
        { trend: "#tuesdayvibe" },
      ],
    };

    const targetUrl =
      "https://world-trends-ai-prompt-generator.rickstaa.dev/api/trends";
    const proxyUrl = "https://api.allorigins.win/get?url=";

    // https://cors-anywhere.herokuapp.com/
    // https://corsproxy.io/?
    // https://thingproxy.freeboard.io/fetch/

    try {
      const response = await fetch(
        `${proxyUrl}${encodeURIComponent(targetUrl)}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const wrapped = await response.json();
      const parsed: TrendsResponse = JSON.parse(wrapped.contents);
      return { trends: parsed.trends ?? fallbackData.trends };
    } catch (proxyError) {
      console.warn("CORS proxy failed, using fallback data:", proxyError);
      return fallbackData;
    }
  }, []);

  const { data, error, loading, refetch } =
    useFetch<TrendsResponse>(fetchTrends);

  return {
    trends: data?.trends ?? [],
    loading,
    error,
    refetch,
  };
}
