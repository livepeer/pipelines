"use client";

import { create } from "zustand";

interface CapacityToastState {
  hasShownToast: boolean;
  markToastAsShown: () => void;
  resetToastState: () => void;
}

export const useCapacityToastStore = create<CapacityToastState>(set => ({
  hasShownToast: false,
  markToastAsShown: () => set({ hasShownToast: true }),
  resetToastState: () => set({ hasShownToast: false }),
}));
