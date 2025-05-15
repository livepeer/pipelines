import { create } from "zustand";

interface PlaybackUrlStore {
  loading: boolean;
  playbackUrl: string | null;
  setPlaybackUrl: (url: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const usePlaybackUrlStore = create<PlaybackUrlStore>(set => ({
  loading: true,
  playbackUrl: null,
  setPlaybackUrl: url => set({ playbackUrl: url }),
  setLoading: (loading: boolean) => set({ loading }),
}));
