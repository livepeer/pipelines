import { create } from "zustand";

interface FullscreenStore {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const useFullscreenStore = create<FullscreenStore>(set => {
  const isFullscreenAPISupported =
    typeof document !== "undefined" &&
    (document.fullscreenEnabled || (document as any).webkitFullscreenEnabled);

  let listenersInitialized = false;

  const initializeListeners = () => {
    if (!listenersInitialized && typeof document !== "undefined") {
      const handleFullscreenChange = () => {
        if (
          !document.fullscreenElement &&
          !(document as any).webkitFullscreenElement
        ) {
          set({ isFullscreen: false });
        }
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      listenersInitialized = true;
    }
  };

  return {
    isFullscreen: false,
    toggleFullscreen: () => {
      set(state => {
        initializeListeners();

        if (isFullscreenAPISupported) {
          if (!state.isFullscreen) {
            if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen();
            } else if (
              (document.documentElement as any).webkitRequestFullscreen
            ) {
              (document.documentElement as any).webkitRequestFullscreen();
            }
          } else {
            if (document.exitFullscreen) {
              document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
              (document as any).webkitExitFullscreen();
            }
          }
        }
        return { isFullscreen: !state.isFullscreen };
      });
    },
  };
});

export default useFullscreenStore;
