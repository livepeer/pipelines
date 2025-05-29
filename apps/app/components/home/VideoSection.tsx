"use client";

import React, { useState, useEffect } from "react";
import { create } from "zustand";
import { LivepeerPlayer } from "./LivepeerPlayer";
import { TransitioningVideo } from "./TransitioningVideo";
import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import useMobileStore from "@/hooks/useMobileStore";

const env = process.env.NEXT_PUBLIC_ENV;

export function getIframeUrl({
  playbackId,
  lowLatency,
}: {
  playbackId: string;
  lowLatency: boolean | "force";
}) {
  const baseUrl = env === "production" ? "lvpr.tv" : "monster.lvpr.tv";
  return `https://${baseUrl}?v=${playbackId}&lowLatency=${lowLatency}&backoffMax=1000&ingestPlayback=true&controls=true`;
}

export function VideoSection() {
  const { isMobile } = useMobileStore();
  const [useLivepeerPlayer, setUseLivepeerPlayer] = useState(false);
  const { currentStream } = useMultiplayerStreamStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setUseLivepeerPlayer(urlParams.get("lpPlayer") === "true");
    }
  }, []);

  if (!currentStream) return null;

  return (
    <div
      className={cn(
        "flex flex-col w-full relative overflow-hidden",
        isMobile ? "h-fit" : "md:w-[70%]",
      )}
    >
      <MultiplayerStreamSelector />
      <TransitioningVideo useLivepeerPlayer={useLivepeerPlayer} />
    </div>
  );
}

interface MultiplayerStream {
  name: string;
  originalPlaybackId: string;
  transformedPlaybackId: string;
  streamKey: string;
}

interface MultiplayerStreamStore {
  streams?: MultiplayerStream[];
  currentStream?: MultiplayerStream;
  setStreams: (streams: MultiplayerStream[]) => void;
  setCurrentStream: (stream: MultiplayerStream) => void;
}

export const useMultiplayerStreamStore = create<MultiplayerStreamStore>(
  set => ({
    streams: (() => {
      const names =
        process.env.NEXT_PUBLIC_MULTIPLAYER_STREAM_NAME?.split(",").map(name =>
          name
            .split("-")
            .map(word => word.trim())
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
        ) || [];
      const originalIds =
        process.env.NEXT_PUBLIC_ORIGINAL_PLAYBACK_ID?.split(",") || [];
      const transformedIds =
        process.env.NEXT_PUBLIC_TRANSFORMED_PLAYBACK_ID?.split(",") || [];
      const streamKeys =
        process.env.NEXT_PUBLIC_MULTIPLAYER_STREAM_KEY?.split(",") || [];

      const minLength = Math.min(
        names.length,
        originalIds.length,
        transformedIds.length,
        streamKeys.length,
      );

      if (minLength === 0) return [];

      return Array.from({ length: minLength }, (_, i) => ({
        name: names[i].trim(),

        originalPlaybackId: originalIds[i].trim(),
        transformedPlaybackId: transformedIds[i].trim(),
        streamKey: streamKeys[i].trim(),
      }));
    })(),
    get currentStream() {
      return this.streams && this.streams.length > 0
        ? this.streams[0]
        : undefined;
    },
    setStreams: (streams: MultiplayerStream[]) => set({ streams }),
    setCurrentStream: (stream: MultiplayerStream) =>
      set({ currentStream: stream }),
  }),
);

const MultiplayerStreamSelector = () => {
  const { isMobile } = useMobileStore();
  const { streams, currentStream, setCurrentStream } =
    useMultiplayerStreamStore();

  useEffect(() => {
    streams && setCurrentStream(streams[0]);
  }, [streams]);

  if (!streams || streams.length === 0) return null;

  return (
    <div
      className={cn(
        "flex justify-start w-full gap-3 p-4 overflow-x-auto",
        isMobile ? "flex p-4" : " absolute z-[9999] justify-end",
      )}
    >
      {streams.map((stream, index) => (
        <Button
          key={stream.streamKey}
          size="sm"
          variant="outline"
          className={cn(
            `rounded-md bg-white text-black text-xs `,
            currentStream?.streamKey === stream.streamKey
              ? isMobile
                ? "outline outline-2 outline-offset-1"
                : "outline outline-2 outline-offset-2 outline-white"
              : "",
            isMobile ? "min-w-[calc(30%)]" : "",
          )}
          onClick={() => {
            if (currentStream?.streamKey === stream.streamKey) return;
            setCurrentStream(stream);
          }}
        >
          {stream.name}
        </Button>
      ))}
    </div>
  );
};
