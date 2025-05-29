"use client";

import React, { useState, useEffect } from "react";
import { create } from "zustand";
import { LivepeerPlayer } from "./LivepeerPlayer";
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

interface VideoSectionProps {
  mainVideoRef: React.RefObject<HTMLDivElement>;
  useLivepeerPlayer?: boolean;
}

export function VideoSection({
  mainVideoRef,
  useLivepeerPlayer = false,
}: VideoSectionProps) {
  const { isMobile } = useMobileStore();
  const { currentStream } = useMultiplayerStreamStore();

  if (!currentStream) return null;

  return (
    <div
      className={cn(
        "flex flex-col w-full relative overflow-hidden",
        isMobile ? "h-fit" : "md:w-[70%]",
      )}
    >
      <MultiplayerStreamSelector />
      {/* Video position reference for transitioning video */}
      <div
        ref={mainVideoRef}
        className={cn(
          "w-full relative overflow-hidden bg-black/10 backdrop-blur-sm shadow-lg",
          isMobile
            ? "aspect-video rounded-none h-[calc(100%)]"
            : "md:rounded-xl md:aspect-video h-[calc(100%)]",
        )}
      >
        {/* On mobile, show static video */}
        {isMobile && (
          <div className="w-full h-full relative overflow-hidden">
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              {useLivepeerPlayer ? (
                <LivepeerPlayer
                  playbackId={currentStream?.transformedPlaybackId}
                  autoPlay={true}
                  muted={false}
                  className={cn(
                    "w-[130%] h-[130%] absolute left-[-15%] top-[-15%]",
                  )}
                  objectFit="cover"
                  env="monster"
                  lowLatency="force"
                />
              ) : (
                <iframe
                  src={getIframeUrl({
                    playbackId: currentStream?.transformedPlaybackId,
                    lowLatency: true,
                  })}
                  className="absolute w-[130%] h-[130%] left-[-15%] top-[-15%]"
                  style={{ overflow: "hidden" }}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  scrolling="no"
                />
              )}
            </div>

            {/* Picture-in-picture for original stream on mobile */}
            <div className="absolute bottom-4 left-4 w-[25%] aspect-video z-30 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
              {useLivepeerPlayer ? (
                <LivepeerPlayer
                  playbackId={currentStream?.originalPlaybackId}
                  autoPlay={true}
                  muted={true}
                  className="w-full h-full"
                  env="studio"
                  lowLatency="force"
                />
              ) : (
                <iframe
                  src={getIframeUrl({
                    playbackId: currentStream?.originalPlaybackId,
                    lowLatency: false,
                  })}
                  className="w-full h-full"
                  style={{ overflow: "hidden" }}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  scrolling="no"
                />
              )}
            </div>
          </div>
        )}
      </div>
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
