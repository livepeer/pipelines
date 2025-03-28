import { create } from "zustand";

export const usePromptStore = create<{
  lastSubmittedPrompt: string | null;
  setLastSubmittedPrompt: (prompt: string | null) => void;
  hasSubmittedPrompt: boolean;
  setHasSubmittedPrompt: (value: boolean) => void;
}>(set => ({
  lastSubmittedPrompt: null,
  setLastSubmittedPrompt: prompt => set({ lastSubmittedPrompt: prompt }),
  hasSubmittedPrompt: false,
  setHasSubmittedPrompt: value => set({ hasSubmittedPrompt: value }),
}));
