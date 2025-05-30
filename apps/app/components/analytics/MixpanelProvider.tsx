"use client";

import { usePrivy } from "@/hooks/usePrivy";
import {
  handleDistinctId,
  handleSessionId,
  SESSION_ID_KEY,
} from "@/lib/analytics/mixpanel";
import { mixpanel as mixpanelConfig } from "@/lib/env";
import track from "@/lib/track";
import mixpanel from "mixpanel-browser";
import { ReactNode, useEffect, useRef } from "react";

const SESSION_START_KEY = "mixpanel_session_started";

export function MixpanelProvider({ children }: { children: ReactNode }) {
  const hasTrackedSessionEnd = useRef(false);
  const sessionStartTime = useRef<number>(Date.now());

  const trackSessionEnd = () => {
    if (hasTrackedSessionEnd.current) return;

    const sessionStarted = sessionStorage.getItem(SESSION_START_KEY);
    if (!sessionStarted) return;

    hasTrackedSessionEnd.current = true;

    const sessionDuration = Math.floor(
      (Date.now() - sessionStartTime.current) / 1000,
    );
    const distinctId = handleDistinctId();
    const sessionId = sessionStorage.getItem(SESSION_ID_KEY);

    if (!sessionId) {
      console.log("No sessionId found, skipping session_end tracking");
      return;
    }

    const eventData = {
      event: "session_end",
      properties: {
        distinct_id: distinctId,
        $session_id: sessionId,
        session_duration: sessionDuration,
        timestamp: new Date().toISOString(),
      },
    };

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/mixpanel",
        new Blob([JSON.stringify(eventData)], { type: "application/json" }),
      );
    } else {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/mixpanel", false);
      xhr.setRequestHeader("Content-Type", "application/json");
      try {
        xhr.send(JSON.stringify(eventData));
      } catch (error) {
        console.error("Failed to send session_end event:", error);
      }
    }

    sessionStorage.removeItem(SESSION_START_KEY);
  };

  useEffect(() => {
    if (mixpanelConfig.projectToken) {
      try {
        console.log("Initializing Mixpanel");
        mixpanel.init(mixpanelConfig.projectToken, { debug: true });

        const distinctId = handleDistinctId();
        const sessionId = handleSessionId();

        console.log(
          "Mixpanel initialized successfully",
          "Distinct Id: ",
          distinctId,
          "Session Id: ",
          sessionId,
        );

        const sessionStarted = sessionStorage.getItem(SESSION_START_KEY);
        const currentSessionId = sessionStorage.getItem(SESSION_ID_KEY);

        if (!sessionStarted || currentSessionId !== sessionId) {
          track("session_start", {
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
            page_path: window.location.pathname,
          });

          sessionStorage.setItem(SESSION_START_KEY, "true");
          sessionStartTime.current = Date.now();
        }
      } catch (error) {
        console.error("Error initializing Mixpanel:", error);
      }
    } else {
      console.warn("No Mixpanel project token found in environment variables");
    }

    const handleBeforeUnload = () => {
      trackSessionEnd();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return <>{children}</>;
}
