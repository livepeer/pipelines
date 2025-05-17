"use client";

import { create } from "zustand";

interface AI {
  aiModeEnabled: boolean;
  toggleAIMode: () => void;
}

const useAI = create<AI>((set) => ({
  aiModeEnabled: true,
  toggleAIMode: () =>
    set((state) => ({
      aiModeEnabled: !state.aiModeEnabled,
    })),
}));

export default useAI;
