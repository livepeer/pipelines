import { create } from "zustand";

interface PromptVersionStore {
  promptVersion: number;
  incrementPromptVersion: () => void;
}

export const usePromptVersionStore = create<PromptVersionStore>(set => ({
  promptVersion: 0,
  incrementPromptVersion: () =>
    set(state => ({ promptVersion: state.promptVersion + 1 })),
}));
