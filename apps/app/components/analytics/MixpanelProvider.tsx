"use client";

import { usePrivy } from "@/hooks/usePrivy";
import mixpanel from "mixpanel-browser";
import { ReactNode, useEffect } from "react";
import { mixpanel as mixpanelConfig } from "@/lib/env";

export function MixpanelProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (mixpanelConfig.projectToken) {
      try {
        console.log("Initializing Mixpanel");
        mixpanel.init(mixpanelConfig.projectToken, {
          debug: true,
          track_pageview: true,
          persistence: "localStorage",
          cross_subdomain_cookie: false,
        });

        try {
          const savedUserId = localStorage.getItem("mixpanel_user_id");
          if (savedUserId) {
            const currentDistinctId = mixpanel.get_distinct_id();
            if (
              currentDistinctId &&
              currentDistinctId !== savedUserId &&
              !currentDistinctId.startsWith("did:")
            ) {
              console.log(
                `Restoring Mixpanel identity from localStorage: ${savedUserId}`,
              );
              mixpanel.identify(savedUserId);
            }
          }
        } catch (e) {
          console.error("Error restoring user identity:", e);
        }

        console.log("Mixpanel initialized successfully");
      } catch (error) {
        console.error("Error initializing Mixpanel:", error);
      }
    } else {
      console.warn("No Mixpanel project token found in environment variables");
    }
  }, []);

  return <>{children}</>;
}
