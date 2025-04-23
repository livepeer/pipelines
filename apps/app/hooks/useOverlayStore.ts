import { create } from "zustand";

interface OverlayStore {
  isOverlayOpen: boolean;
  overlayType: "bento" | "clip" | null;
  selectedClipId: string | null;
  selectedPrompt: string | null;
  cachedClips: any[];
  scrollPosition: number;
  setIsOverlayOpen: (isOpen: boolean) => void;
  setOverlayType: (type: "bento" | "clip" | null) => void;
  setSelectedClipId: (clipId: string | null) => void;
  setSelectedPrompt: (prompt: string | null) => void;
  setCachedClips: (clips: any[]) => void;
  setScrollPosition: (position: number) => void;
  closeOverlay: () => void;
}

export const useOverlayStore = create<OverlayStore>(set => ({
  isOverlayOpen: false,
  overlayType: null,
  selectedClipId: null,
  selectedPrompt: null,
  cachedClips: [],
  scrollPosition: 0,
  setIsOverlayOpen: (isOpen: boolean) => set({ isOverlayOpen: isOpen }),
  setOverlayType: (type: "bento" | "clip" | null) => set({ overlayType: type }),
  setSelectedClipId: (clipId: string | null) => set({ selectedClipId: clipId }),
  setSelectedPrompt: (prompt: string | null) => set({ selectedPrompt: prompt }),
  setCachedClips: (clips: any[]) => set({ cachedClips: clips }),
  setScrollPosition: (position: number) => set({ scrollPosition: position }),
  closeOverlay: () =>
    set({
      isOverlayOpen: false,
      // Don't reset these values to preserve state between openings
      // overlayType: null,
      // selectedClipId: null
    }),
}));
