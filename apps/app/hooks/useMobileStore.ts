"use client";

import { create } from "zustand";

const MOBILE_BREAKPOINT = 768;
const HEIGHT_BREAKPOINT = 592;

interface MobileStore {
  isMobile: boolean;
  isMinHeightScreen: boolean;
}

const useMobileStore = create<MobileStore>(set => {
  let listenerInitialized = false;

  const initializeListener = () => {
    if (typeof window === "undefined" || listenerInitialized) return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const heightMql = window.matchMedia(
      `(max-height: ${HEIGHT_BREAKPOINT - 1}px)`,
    );

    const onChange = () => {
      set({
        isMobile: window.innerWidth < MOBILE_BREAKPOINT,
        isMinHeightScreen: window.innerHeight < HEIGHT_BREAKPOINT,
      });
    };

    mql.addEventListener("change", onChange);
    heightMql.addEventListener("change", onChange);
    onChange();

    listenerInitialized = true;
  };

  if (typeof window !== "undefined") {
    initializeListener();
  }

  return {
    isMobile:
      typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT,
    isMinHeightScreen:
      typeof window !== "undefined" && window.innerHeight < HEIGHT_BREAKPOINT,
  };
});

export default useMobileStore;
