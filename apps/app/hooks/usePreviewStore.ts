import { create } from "zustand";

interface PreviewStore {
  isPreviewOpen: boolean;
  setIsPreviewOpen: (isOpen: boolean) => void;
}

export const usePreviewStore = create<PreviewStore>(set => ({
  isPreviewOpen: false,
  setIsPreviewOpen: (isOpen: boolean) => set({ isPreviewOpen: isOpen }),
}));
