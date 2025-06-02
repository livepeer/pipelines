"use client";

import { usePlaybackUrlStore } from "@/hooks/usePlaybackUrlStore";
import { useEffect } from "react";

export const ServiceWorker = () => {
  const { setPlaybackUrl, setLoading } = usePlaybackUrlStore();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerAndSetupMessaging = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");
          console.debug(
            "[Service Worker] Registration successful with scope: ",
            registration.scope,
          );

          if (registration.installing) {
            console.debug("[Service Worker] State: Installing");
            registration.installing.addEventListener("statechange", e => {
              if ((e.target as ServiceWorker).state === "installed") {
                console.debug(
                  "[Service Worker] State: New worker installed (from installing statechange)",
                );
              }
            });
          } else if (registration.waiting) {
            console.debug("[Service Worker] State: Installed (waiting)");
          } else if (registration.active) {
            console.debug("[Service Worker] State: Active");
          }

          await navigator.serviceWorker.ready;
          console.debug("[Service Worker] Ready and controlling the page.");

          if (navigator.serviceWorker.controller) {
            console.debug(
              "[Service Worker] Controller found. Ready to receive messages.",
            );
          } else {
            console.warn(
              "[Service Worker] No controller found. Page might not be controlled yet. A refresh might be needed if skipWaiting/clients.claim wasn't effective immediately on first load.",
            );
          }
        } catch (error) {
          console.error("[Service Worker] Registration failed:", error);
        }
      };

      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === "HEADER_FOUND") {
          console.debug(
            "[Service Worker Client]: Message received:",
            event.data.payload,
          );
          setPlaybackUrl(event.data.payload.headerValue);
          setLoading(false);
        }

        if (event.data && event.data.type === "HEADER_NOT_FOUND") {
          console.debug(
            "[Service Worker Client]: Message received:",
            event.data.payload,
          );
          setPlaybackUrl(null);
          setLoading(false);
        }
      };

      navigator.serviceWorker.addEventListener("message", handleMessage);
      registerAndSetupMessaging();

      return () => {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
        console.debug("[Service Worker Client]: Message listener removed.");
      };
    }
  }, [setPlaybackUrl]);

  return <></>;
};
