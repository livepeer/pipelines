"use client";

import React, { useState, useEffect } from "react";
import { create } from "zustand";
import { LivepeerPlayer } from "./LivepeerPlayer";
import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import useMobileStore from "@/hooks/useMobileStore";
import { QRCodeComponent } from "../QRCode";

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
      className={cn(
        "flex flex-col w-full relative",
        isMobile ? "h-fit" : "md:w-[70%]",
      )}
    >
      <MultiplayerStreamSelector />
      <div
        className={cn(
          "w-full relative bg-black/10 backdrop-blur-sm shadow-lg",
          isMobile
            ? "aspect-video rounded-none h-[calc(100%)]"
            : "md:rounded-xl md:aspect-video h-[calc(100%)]",
        )}
      >
        <div className="w-full h-full relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* QR Code for mobile prompt page */}
          {currentStream && (
            <div className="absolute top-4 left-4 z-40">
              <QRCodeComponent
                url={`${typeof window !== "undefined" ? window.location.origin : ""}/stream/${currentStream.streamId}/prompt`}
                size={80}
                className="opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
          )}

          <div
            className={cn(
              "absolute inset-0 w-full h-full overflow-hidden rounded-xl",
              isMobile && "relative overflow-visible",
            )}
          >
            {useLivepeerPlayer ? (
              <LivepeerPlayer
                playbackId={currentStream?.transformedPlaybackId}
                autoPlay={true}
                muted={false}
                className={cn(
                  "w-[120%] h-[120%] absolute left-[-10%] top-[-10%]",
                  isMobile ? "w-[130%] h-[130%]" : "",
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
                className={cn(
                  "absolute w-[120%] h-[120%] left-[-10%] top-[-10%] md:w-[120%] md:h-[120%] md:left-[-10%] md:top-[-10%]",
                  isMobile ? "w-[100%] h-[100%] left-[0%] top-[0%]" : "",
                )}
                allow="autoplay; fullscreen"
                allowFullScreen
                onLoad={() => setIsLoading(false)}
                scrolling="no"
              />
            )}
          </div>

          <div
            className={cn(
              isMobile
                ? "relative inset-0 w-full h-full"
                : "absolute bottom-4 left-4 w-[25%] aspect-video z-30 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg hidden md:block",
            )}
          >
            {useLivepeerPlayer ? (
              <LivepeerPlayer
                playbackId={currentStream?.originalPlaybackId}
                autoPlay={true}
                muted={true}
                className={cn(
                  "w-full h-full",
                  isMobile ? "w-[130%] h-[130%] left-[-15%] top-[-15%]" : "",
                )}
                env="studio"
                lowLatency="force"
              />
            ) : (
              <iframe
                src={getIframeUrl({
                  playbackId: currentStream?.originalPlaybackId,
                  lowLatency: false,
                })}
                className={cn(
                  "w-full h-full",
                  isMobile
                    ? "absolute w-[100%] h-[100%] left-[0%] top-[0%]"
                    : "",
                )}
                allow="autoplay; fullscreen"
                allowFullScreen
                scrolling="no"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MultiplayerStream {
  name: string;
  originalPlaybackId: string;
  transformedPlaybackId: string;
  streamId: string;
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
      const streamIds =
        process.env.NEXT_PUBLIC_MULTIPLAYER_STREAM_ID?.split(",") || [];

      const minLength = Math.min(
        names.length,
        originalIds.length,
        transformedIds.length,
        streamIds.length,
      );

      if (minLength === 0) return [];

      return Array.from({ length: minLength }, (_, i) => ({
        name: names[i].trim(),

        originalPlaybackId: originalIds[i].trim(),
        transformedPlaybackId: transformedIds[i].trim(),
        streamId: streamIds[i].trim(),
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
        isMobile
          ? "flex p-4 overflow-y-hidden"
          : " absolute z-[9999] justify-end",
      )}
    >
      {streams.map((stream, index) => (
        <Button
          key={stream.streamId}
          size="sm"
          variant="outline"
          className={cn(
            `rounded-md bg-white text-black text-xs `,
            currentStream?.streamId === stream.streamId
              ? isMobile
                ? "outline outline-2 outline-offset-1"
                : "outline outline-2 outline-offset-2 outline-white"
              : "",
            isMobile ? "min-w-[calc(30%)]" : "",
          )}
          onClick={() => {
            if (currentStream?.streamId === stream.streamId) return;
            setCurrentStream(stream);
          }}
        >
          <span className="truncate">{stream.name}</span>
        </Button>
      ))}
    </div>
  );
};
