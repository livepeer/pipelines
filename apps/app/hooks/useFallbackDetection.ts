import { useCallback, useEffect, useRef, useState } from "react";
import { sendKafkaEvent } from "@/lib/analytics/event-middleware";
import { usePrivy } from "@/hooks/usePrivy";

const TIME_TO_FALLBACK_VIDEOJS_MS = 12000;
/**
 * This hook tracks errors and determines when to switch to the VideoJS fallback player
 * based on error patterns and video playback status.
 */
export const useFallbackDetection = (playbackId: string) => {
  const [useFallbackPlayer, setUseFallbackPlayer] = useState(false);
  const lastErrorTimeRef = useRef<number | null>(null);
  const errorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = usePrivy();

  const trackFallbackEvent = useCallback(
    (reason: string, errorDetails?: string) => {
      sendKafkaEvent(
        "stream_trace",
        {
          type: "app_player_fallback_to_videojs",
          playback_id: playbackId,
          reason: reason,
          error_details: errorDetails || "",
        },
        "daydream",
        "server",
        user || undefined,
      );
    },
    [playbackId, user],
  );

  const handleError = useCallback(
    (error: any) => {
      let errorMessage;
      try {
        errorMessage =
          typeof error?.message === "string"
            ? error.message
            : typeof error === "string"
              ? error
              : JSON.stringify(error);
      } catch (e) {
        errorMessage = "Unserializable error object";
      }

      const currentTime = Date.now();
      lastErrorTimeRef.current = currentTime;

      if (errorMessage.includes("Failed to connect to peer")) {
        console.warn(
          "Failed to connect to peer. Switching to VideoJS fallback player.",
        );
        setUseFallbackPlayer(true);
        trackFallbackEvent("peer_connection_failure", errorMessage);
        return;
      }

      if (!errorIntervalRef.current && !useFallbackPlayer) {
        if (errorIntervalRef.current) {
          clearInterval(errorIntervalRef.current);
        }

        errorIntervalRef.current = setInterval(() => {
          const now = Date.now();
          const lastErrorTime = lastErrorTimeRef.current || 0;
          const timeSinceLastError = now - lastErrorTime;

          const playerElement = document.querySelector("video");
          const isPlaying =
            playerElement &&
            !playerElement.paused &&
            playerElement.currentTime > 0 &&
            !playerElement.ended;

          if (timeSinceLastError > TIME_TO_FALLBACK_VIDEOJS_MS && !isPlaying) {
            console.warn("Switching to VideoJS fallback player.");
            setUseFallbackPlayer(true);
            trackFallbackEvent(
              "timeout_error_reached",
              `Last error time: ${lastErrorTime}`,
            );

            if (errorIntervalRef.current) {
              clearInterval(errorIntervalRef.current);
              errorIntervalRef.current = null;
            }
          } else if (isPlaying) {
            if (errorIntervalRef.current) {
              clearInterval(errorIntervalRef.current);
              errorIntervalRef.current = null;
            }
          }
        }, 1000);
      }
    },
    [useFallbackPlayer, trackFallbackEvent],
  );

  useEffect(() => {
    return () => {
      if (errorIntervalRef.current) {
        clearInterval(errorIntervalRef.current);
        errorIntervalRef.current = null;
      }
    };
  }, []);

  return { useFallbackPlayer, handleError, trackFallbackEvent };
};
