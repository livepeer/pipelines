"use client";

import { usePrivy } from "@/hooks/usePrivy";
import {
  handleDistinctId,
  handleSessionEnd,
  handleSessionId,
  setCookies,
} from "@/lib/analytics/mixpanel";
import { mixpanel as mixpanelConfig } from "@/lib/env";
import mixpanel from "mixpanel-browser";
import { ReactNode, useEffect } from "react";

export function MixpanelProvider({ children }: { children: ReactNode }) {
  const { user, ready } = usePrivy();

  useEffect(() => {
    if (mixpanelConfig.projectToken) {
      try {
        console.log("Initializing Mixpanel");
        mixpanel.init(mixpanelConfig.projectToken, { debug: true });

        const initSession = async () => {
          const distinctId = await handleDistinctId(user);
          const sessionId = await handleSessionId();
          if (ready) {
            setCookies(distinctId || "", sessionId || "", user?.id || "");
          } else {
            setCookies(distinctId || "", sessionId || "");
          }
        };

        initSession();
        console.log("Mixpanel initialized successfully", user, ready);

        const onBeforeUnload = () => {
          handleSessionEnd();
        };

        window.addEventListener("beforeunload", onBeforeUnload);

        console.log("Mixpanel initialized successfully", user, ready);
        return () => {
          window.removeEventListener("beforeunload", onBeforeUnload);
          handleSessionEnd();
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
