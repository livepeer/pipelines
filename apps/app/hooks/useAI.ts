"use client";

import { create } from "zustand";

interface AI {
  aiModeEnabled: boolean;
  isChatAssistantOpen: boolean;
  toggleAIMode: () => void;
  setChatAssistantOpen: (open: boolean) => void;
}

const useAI = create<AI>(set => ({
  aiModeEnabled: false,
  isChatAssistantOpen: false,

  toggleAIMode: () =>
    set(state => {
      const nextAIMode = !state.aiModeEnabled;
      return {
        aiModeEnabled: nextAIMode,

        isChatAssistantOpen: nextAIMode ? true : state.isChatAssistantOpen,
      };
    }),

  setChatAssistantOpen: (open: boolean) => set({ isChatAssistantOpen: open }),
}));

export default useAI;
