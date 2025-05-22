"use client";

import React, { useState, useEffect } from "react";
import { LivepeerPlayer } from "./LivepeerPlayer";
import { Camera } from "lucide-react";
import { TrackedButton } from "@/components/analytics/TrackedButton";
import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";

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
  isMobile?: boolean;
  onTryCameraClick?: () => void;
  buttonText?: string;
}

export function VideoSection({
  isMobile = false,
  onTryCameraClick,
  buttonText = "Create",
}: VideoSectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [useLivepeerPlayer, setUseLivepeerPlayer] = useState(false);
  const { currentStream } = useMultiplayerStreamStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setUseLivepeerPlayer(urlParams.get("lpPlayer") === "true");
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!currentStream) return null;

  return (
    <div
      className={`flex flex-col w-full ${isMobile ? "h-full mt-[3%]" : "md:w-[70%]"}`}
    >
      <div className="w-full py-3 px-4 hidden md:flex items-center justify-between">
        <h1
          className="text-4xl md:text-[36px] font-bold tracking-widest italic"
          style={{ color: "#000000" }}
        >
          DAYDREAM
        </h1>
      </div>

      {isMobile && onTryCameraClick && (
        <div className="flex justify-center w-full mb-4 px-4">
          <TrackedButton
            className="px-5 py-2 rounded-lg bg-white/85 text-black hover:bg-white flex items-center justify-center gap-2 backdrop-blur-sm w-full mx-4"
            onClick={onTryCameraClick}
            trackingEvent="mobile_top_center_camera_clicked"
            trackingProperties={{ location: "mobile_top_center" }}
          >
            <Camera className="h-4 w-4" />
            {buttonText}
          </TrackedButton>
        </div>
      )}

      <div
        className={`w-full relative ${
          isMobile
            ? "aspect-square rounded-none"
            : "md:rounded-xl md:aspect-video h-[calc(100%-65px)]"
        } overflow-hidden bg-black/10 backdrop-blur-sm shadow-lg`}
      >
        <div className="w-full h-full relative overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {useLivepeerPlayer ? (
              <LivepeerPlayer
                playbackId={currentStream?.transformedPlaybackId}
                autoPlay={true}
                muted={false}
                className="w-[120%] h-[120%] absolute left-[-10%] top-[-10%]"
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
                className="absolute w-[120%] h-[120%] left-[-10%] top-[-10%] md:w-[120%] md:h-[120%] md:left-[-10%] md:top-[-10%]"
                style={{ overflow: "hidden" }}
                allow="autoplay; fullscreen"
                allowFullScreen
                onLoad={() => setIsLoading(false)}
                scrolling="no"
              />
            )}
          </div>

          {!isMobile && (
            <div className="absolute bottom-4 left-4 w-[25%] aspect-video z-30 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg hidden md:block">
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
          )}

          {/* <div className="absolute inset-0 z-20 pointer-events-auto bg-transparent"></div> */}

          <MultiplayerStreamSelector />
        </div>
      </div>
    </div>
  );
}

import { create } from "zustand";

interface MultiplayerStream {
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
      const originalIds =
        process.env.NEXT_PUBLIC_ORIGINAL_PLAYBACK_ID?.split(",") || [];
      const transformedIds =
        process.env.NEXT_PUBLIC_TRANSFORMED_PLAYBACK_ID?.split(",") || [];
      const streamKeys =
        process.env.NEXT_PUBLIC_MULTIPLAYER_STREAM_KEY?.split(",") || [];

      const minLength = Math.min(
        originalIds.length,
        transformedIds.length,
        streamKeys.length,
      );

      if (minLength === 0) return [];

      return Array.from({ length: minLength }, (_, i) => ({
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
  const { streams, currentStream, setCurrentStream } =
    useMultiplayerStreamStore();

  useEffect(() => {
    streams && setCurrentStream(streams[0]);
  }, [streams]);

  if (!streams || streams.length === 0) return null;

  return (
    <div className="absolute flex justify-end w-full gap-3 p-4">
      {streams.map((stream, index) => (
        <Button
          key={stream.streamKey}
          className={cn(
            `border rounded-lg bg-black`,
            currentStream?.streamKey === stream.streamKey
              ? "border-indigo-600 ring-2 ring-indigo-600/50 shadow-md shadow-indigo-600/30"
              : "border-neutral-600",
          )}
          onClick={() => {
            if (currentStream?.streamKey === stream.streamKey) return;
            setCurrentStream(stream);
          }}
        >
          Stream {index + 1}
        </Button>
      ))}
    </div>
  );
};
