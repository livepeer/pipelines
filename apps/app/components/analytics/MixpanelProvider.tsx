"use client";

import { useMixpanelStore } from "@/hooks/useMixpanelStore";
import useMount from "@/hooks/useMount";
import { mixpanel as mixpanelConfig } from "@/lib/env";
import { usePrivy } from "@privy-io/react-auth";
import mixpanel from "mixpanel-browser";
import { ReactNode, useEffect, useRef } from "react";

export function MixpanelProvider({ children }: { children: ReactNode }) {
  const { user, ready } = usePrivy();
  const { sessionId, distinctId, initializeDistinctId, initializeSessionId } =
    useMixpanelStore();

  useMount(() => {
    if (mixpanelConfig.projectToken) {
      try {
        console.log("Initializing Mixpanel");
        mixpanel.init(mixpanelConfig.projectToken, { debug: true });

        initializeDistinctId();
        initializeSessionId();
        console.log("Mixpanel initialized successfully", user, ready);
      } catch (error) {
        console.error("Error initializing Mixpanel:", error);
      }
    } else {
      console.warn("No Mixpanel project token found in environment variables");
    }
  });

  // TODO: Remove these
  useEffect(() => {
    if (mixpanelConfig.projectToken && distinctId) {
      document.cookie = `mixpanel_distinct_id=${distinctId}; path=/`;
    }
  }, [distinctId]);

  useEffect(() => {
    if (mixpanelConfig.projectToken && sessionId) {
      document.cookie = `mixpanel_session_id=${sessionId}; path=/`;
    }
  }, [sessionId]);

  useEffect(() => {
    if (mixpanelConfig.projectToken && ready && user) {
      document.cookie = `mixpanel_user_id=${user.id}; path=/`;
    }
  }, [ready, user]);

  return <>{children}</>;
}
