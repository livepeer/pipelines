"use client";

import { usePlaybackUrlStore } from "@/hooks/usePlaybackUrlStore";
import { useEffect } from "react";

export const ServiceWorker = () => {
  const { setPlaybackUrl } = usePlaybackUrlStore();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");
          if (registration.installing) {
            console.debug("[Service Worker] Installing");
          } else if (registration.waiting) {
            console.debug("[Service Worker] Installed");
          } else if (registration.active) {
            console.debug("[Service Worker] Active");
          }
        } catch (error) {
          console.error("[Service Worker] Registration failed:", error);
        }
      };

      registerServiceWorker();

      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === "HEADER_FOUND") {
          console.log("[Service Worker]:", event.data.payload);
          setPlaybackUrl(event.data.payload.headerValue);
        }
      };

      navigator.serviceWorker.addEventListener("message", handleMessage);

      return () => {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      };
    }
  }, []);

  return <></>;
};
