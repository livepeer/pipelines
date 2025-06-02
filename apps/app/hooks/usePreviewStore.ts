import { create } from "zustand";

interface PreviewStore {
  isPreviewOpen: boolean;
  setIsPreviewOpen: (isOpen: boolean) => void;
  openedClipId?: string; // redundant, but semantically clear
  setOpenedClipId: (clipId: string) => void;
}

export const usePreviewStore = create<PreviewStore>(set => ({
  isPreviewOpen: false,
  setIsPreviewOpen: (isOpen: boolean) => set({ isPreviewOpen: isOpen }),
  openedClipId: undefined,
  setOpenedClipId: (clipId: string) => set({ openedClipId: clipId }),
}));
