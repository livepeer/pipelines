"use client";

import { usePrivy } from "@/hooks/usePrivy";
import {
  handleDistinctId,
  handleSessionEnd,
  handleSessionId,
  // setCookies,
} from "@/lib/analytics/mixpanel";
import { mixpanel as mixpanelConfig } from "@/lib/env";
import mixpanel from "mixpanel-browser";
import { ReactNode, useEffect } from "react";

export function MixpanelProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (mixpanelConfig.projectToken) {
      try {
        console.log("Initializing Mixpanel");
        mixpanel.init(mixpanelConfig.projectToken, { debug: true });

        const distinctId = handleDistinctId();
        const sessionId = handleSessionId();
        // setCookies(distinctId || "", sessionId || "");

        // Clean up sessions when page is unloaded

        //const handleBeforeUnload = () => {
        //handleSessionEnd();
        //};

        //window.addEventListener('beforeunload', handleBeforeUnload);

        console.log("Mixpanel initialized successfully");
        return () => {
          handleSessionEnd();
          //window.removeEventListener('beforeunload', handleBeforeUnload);
        };
      } catch (error) {
        console.error("Error initializing Mixpanel:", error);
      }
    } else {
      console.warn("No Mixpanel project token found in environment variables");
    }
  }, []);

  return <>{children}</>;
}
