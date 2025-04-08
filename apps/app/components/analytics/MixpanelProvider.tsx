"use client";

import { useMixpanelStore } from "@/hooks/useMixpanelStore";
import useMount from "@/hooks/useMount";
import { identifyUser } from "@/lib/analytics/mixpanel";
import { mixpanel as mixpanelConfig } from "@/lib/env";
import { usePrivy } from "@privy-io/react-auth";
import mixpanel from "mixpanel-browser";
import { ReactNode, useEffect, useRef } from "react";

export function MixpanelProvider({ children }: { children: ReactNode }) {
  const { user, ready } = usePrivy();
  const { sessionId, distinctId } = useMixpanelStore();
  const mixpanelInitialized = useRef(false);

  useEffect(() => {
    const init = async () => {
      if (
        mixpanelConfig.projectToken &&
        distinctId &&
        !mixpanelInitialized.current
      ) {
        try {
          console.log("MixpanelProvider: Initializing Mixpanel...");
          mixpanel.init(mixpanelConfig.projectToken, {
            debug: true,
          });
          mixpanelInitialized.current = true;
          console.log("MixpanelProvider: Mixpanel initialized.");

          if (ready && user) {
            console.log(
              `MixpanelProvider: User ${user.id} is ready. Calling identifyUser.`,
            );
            await identifyUser(user.id, distinctId, user);
          } else {
            const currentMixpanelId = mixpanel.get_distinct_id();
            if (currentMixpanelId !== distinctId) {
              console.log(
                `MixpanelProvider: Aligning Mixpanel ID (${currentMixpanelId}) with store ID (${distinctId}). Calling identify.`,
              );
              mixpanel.identify(distinctId);
            } else {
              console.log(
                `MixpanelProvider: Mixpanel already using correct distinct_id (${distinctId}).`,
              );
            }
          }
        } catch (error) {
          console.error(
            "MixpanelProvider: Error initializing or identifying Mixpanel:",
            error,
          );
        }
      } else if (!mixpanelConfig.projectToken) {
        console.warn(
          "MixpanelProvider: No Mixpanel project token found in environment variables",
        );
      }
    };

    init();
  }, [mixpanelConfig.projectToken, distinctId, ready, user]);

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
