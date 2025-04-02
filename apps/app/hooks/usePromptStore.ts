import { create } from "zustand";

interface PromptStore {
  lastSubmittedPrompt: string | null;
  setLastSubmittedPrompt: (prompt: string | null) => void;
  hasSubmittedPrompt: boolean;
  setHasSubmittedPrompt: (value: boolean) => void;
}

export const usePromptStore = create<PromptStore>(set => ({
  lastSubmittedPrompt: null,
  setLastSubmittedPrompt: prompt => set({ lastSubmittedPrompt: prompt }),
  hasSubmittedPrompt: false,
  setHasSubmittedPrompt: value => set({ hasSubmittedPrompt: value }),
}));
