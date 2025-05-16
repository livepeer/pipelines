import { MULTIPLAYER_FALLBACK_STREAMS } from "@/lib/utils";
import { create } from "zustand";

interface MultiplayerStore {
  streamKey: string;
  originalPlaybackId: string;
  transformedPlaybackId: string;
  setStreamInfo: ({
    streamKey,
    originalPlaybackId,
    transformedPlaybackId,
  }: {
    streamKey?: string;
    originalPlaybackId?: string;
    transformedPlaybackId?: string;
  }) => void;
}

const initialState: Omit<MultiplayerStore, "setStreamInfo"> =
  MULTIPLAYER_FALLBACK_STREAMS[0];

export const useMultiplayerStore = create<MultiplayerStore>(set => ({
  ...initialState,
  setStreamInfo: ({
    streamKey,
    originalPlaybackId,
    transformedPlaybackId,
  }: {
    streamKey?: string;
    originalPlaybackId?: string;
    transformedPlaybackId?: string;
  }) => set({ streamKey, originalPlaybackId, transformedPlaybackId }),
}));
