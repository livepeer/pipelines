import { create } from "zustand";

export const usePromptVersionStore = create<{
  promptVersion: number;
  incrementPromptVersion: (value: number) => void;
}>((set, get) => ({
  promptVersion: 0,
  incrementPromptVersion: () => set({ promptVersion: get().promptVersion + 1 }),
}));
