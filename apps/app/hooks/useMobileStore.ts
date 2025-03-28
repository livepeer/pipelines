import { create } from "zustand";

const MOBILE_BREAKPOINT = 768;

interface IsMobileState {
  isMobile: boolean;
}

const useMobileStore = create<IsMobileState>(set => {
  let listenerInitialized = false;

  const initializeListener = () => {
    if (typeof window === "undefined" || listenerInitialized) return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => {
      set({ isMobile: window.innerWidth < MOBILE_BREAKPOINT });
    };

    mql.addEventListener("change", onChange);
    console.log("onChangeCalled", window.innerWidth, MOBILE_BREAKPOINT);
    onChange();

    listenerInitialized = true;
  };

  if (typeof window !== "undefined") {
    initializeListener();
  }

  return {
    isMobile: window.innerWidth < MOBILE_BREAKPOINT,
  };
});

export default useMobileStore;
