import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GuestUserState {
  isGuestUser: boolean;
  promptCount: number;
  hasRecordedClip: boolean;
  hasShared: boolean;
  lastPrompt: string | null;

  // Actions
  setIsGuestUser: (value: boolean) => void;
  incrementPromptCount: () => void;
  resetPromptCount: () => void;
  setHasRecordedClip: (value: boolean) => void;
  setHasShared: (value: boolean) => void;
  setLastPrompt: (prompt: string | null) => void;
  resetGuestState: () => void;
}

const initialState = {
  isGuestUser: false,
  promptCount: 0,
  hasRecordedClip: false,
  hasShared: false,
  lastPrompt: null,
};

export const useGuestUserStore = create<GuestUserState>()(
  persist(
    set => ({
      ...initialState,

      setIsGuestUser: value => set({ isGuestUser: value }),
      incrementPromptCount: () =>
        set(state => ({ promptCount: state.promptCount + 1 })),
      resetPromptCount: () => set({ promptCount: 0 }),
      setHasRecordedClip: value => set({ hasRecordedClip: value }),
      setHasShared: value => set({ hasShared: value }),
      setLastPrompt: prompt => set({ lastPrompt: prompt }),
      resetGuestState: () => set(initialState),
    }),
    {
      name: "daydream-guest-user-storage",
    },
  ),
);
