"use client";

import { ReactNode, useEffect } from "react";
import mixpanel from "mixpanel-browser";
import { mixpanel as mixpanelConfig } from "@/lib/env";
import { usePrivy } from "@privy-io/react-auth";
import { 
  handleDistinctId, 
  handleSessionId, 
  setCookies, 
  handleSessionEnd
} from "@/lib/analytics/mixpanel";

export function MixpanelProvider({ children}: { children: ReactNode }) {
  const { user, ready } = usePrivy();
  useEffect(() => {
    if (mixpanelConfig.projectToken) {
      try {
        console.log("Initializing Mixpanel");
        mixpanel.init(mixpanelConfig.projectToken, { debug: true });

        const initSession = async () => {
          const distinctId = await handleDistinctId(
            user,
          );
          const sessionId = await handleSessionId();
          if (ready) {
            setCookies(distinctId || "", sessionId || "", user?.id || "");
          } else {
            setCookies(distinctId || "", sessionId || "");
          }
        };

        initSession();

        // Clean up sessions when page is unloaded
        //const handleBeforeUnload = () => {
        //handleSessionEnd();
        //};

        //window.addEventListener('beforeunload', handleBeforeUnload);

        console.log("Mixpanel initialized successfully", user, ready);
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
