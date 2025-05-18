"use client";

import { useCallback } from "react";
import { useFetch } from "./useFetch";
import { fallbackData, TrendsResponse } from "@/lib/prompting/constants";

export function useWorldTrends() {
  const fetchTrends = useCallback(async (): Promise<TrendsResponse> => {
    const targetUrl =
      "https://world-trends-ai-prompt-generator.rickstaa.dev/api/trends";
    const proxyUrl = "https://api.allorigins.win/get?url=";

    // additional proxy urls
    // https://cors-anywhere.herokuapp.com/
    // https://corsproxy.io/?
    // https://thingproxy.freeboard.io/fetch/

 
    try {
      const response = await fetch(
        `${proxyUrl}${encodeURIComponent(targetUrl)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const wrapped = await response.json();
      const parsed: TrendsResponse = JSON.parse(wrapped.contents);
      return { trends: parsed.trends ?? fallbackData.trends };
    } catch {
      console.warn("CORS proxy failed, using fallback data");
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
