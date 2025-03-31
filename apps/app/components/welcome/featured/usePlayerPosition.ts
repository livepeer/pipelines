import useMobileStore from "@/hooks/useMobileStore";
import { debounce } from "@/lib/debounce";
import { RefObject, useEffect } from "react";
import { create } from "zustand";

interface PlayerPosition {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface PlayerPositionState {
  position: PlayerPosition;
  setPosition: (position: PlayerPosition) => void;
}

export const usePlayerPositionStore = create<PlayerPositionState>(set => ({
  position: { top: 0, bottom: 0, left: 0, right: 0 },
  setPosition: position => set({ position }),
}));

export function usePlayerPositionUpdater(
  outputPlayerRef: RefObject<HTMLDivElement>,
): void {
  const setPosition = usePlayerPositionStore(state => state.setPosition);
  const { isMobile } = useMobileStore();

  useEffect(() => {
    if (!isMobile && outputPlayerRef.current) {
      const updatePlayerPosition = (): void => {
        if (!outputPlayerRef.current) return;
        const rect = outputPlayerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
        });
      };

      const debouncedUpdate = debounce(updatePlayerPosition, 30);

      updatePlayerPosition();
      const initialTimeout = setTimeout(updatePlayerPosition, 300);

      window.addEventListener("resize", debouncedUpdate);
      window.addEventListener("scroll", debouncedUpdate, { passive: true });

      const resizeObserver = new ResizeObserver(debouncedUpdate);
      if (outputPlayerRef.current) {
        resizeObserver.observe(outputPlayerRef.current);
      }

      const parentElement =
        outputPlayerRef.current.parentElement || document.body;
      const bodyObserver = new MutationObserver(debouncedUpdate);
      bodyObserver.observe(parentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
      });

      return () => {
        clearTimeout(initialTimeout);
        debouncedUpdate.cancel();
        window.removeEventListener("resize", debouncedUpdate);
        window.removeEventListener("scroll", debouncedUpdate);
        resizeObserver.disconnect();
        bodyObserver.disconnect();
      };
    }
  }, [isMobile, outputPlayerRef, setPosition]);
}
