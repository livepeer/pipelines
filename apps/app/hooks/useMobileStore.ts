"use client";

import { create } from "zustand";

const MOBILE_BREAKPOINT_WIDTH = 768;
const MOBILE_BREAKPOINT_HEIGHT = 768;

interface MobileStore {
  isMobile: boolean;
}

const useMobileStore = create<MobileStore>(set => {
  let listenerInitialized = false;

  const initializeListener = () => {
    if (typeof window === "undefined" || listenerInitialized) return;

    const mql = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT_WIDTH - 1}px) or (max-height: ${MOBILE_BREAKPOINT_HEIGHT - 1}px)`,
    );

    const onChange = () => {
      set({
        isMobile:
          window.innerWidth < MOBILE_BREAKPOINT_WIDTH ||
          window.innerHeight < MOBILE_BREAKPOINT_HEIGHT,
      });
    };

    mql.addEventListener("change", onChange);
    onChange();

    listenerInitialized = true;
  };

  if (typeof window !== "undefined") {
    initializeListener();
  }

  return {
    isMobile:
      (typeof window !== "undefined" &&
        window.innerWidth < MOBILE_BREAKPOINT_WIDTH) ||
      window.innerHeight < MOBILE_BREAKPOINT_HEIGHT,
  };
});

export default useMobileStore;
