import { create } from "zustand";

interface PlaybackUrlStore {
  playbackUrl: string | null;
  setPlaybackUrl: (url: string | null) => void;
}

export const usePlaybackUrlStore = create<PlaybackUrlStore>(set => ({
  playbackUrl: null,
  setPlaybackUrl: url => set({ playbackUrl: url }),
}));
