"use client";

import React, { useState, useEffect } from "react";
import { LivepeerPlayer } from "./LivepeerPlayer";
import useMobileStore from "@/hooks/useMobileStore";
import { cn } from "@repo/design-system/lib/utils";
export const TRANSFORMED_PLAYBACK_ID =
  process.env.NEXT_PUBLIC_TRANSFORMED_PLAYBACK_ID ?? "";
const ORIGINAL_PLAYBACK_ID = process.env.NEXT_PUBLIC_ORIGINAL_PLAYBACK_ID ?? "";

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
  const transformedIframeUrl = getIframeUrl({
    playbackId: TRANSFORMED_PLAYBACK_ID,
    lowLatency: true,
  });
  const originalIframeUrl = getIframeUrl({
    playbackId: ORIGINAL_PLAYBACK_ID,
    lowLatency: false,
  });

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

  return (
    <div
      className={cn("flex flex-col w-full", isMobile ? "h-fit" : "md:w-[70%]")}
    >
      <div
        className={cn(
          "w-full relative overflow-hidden bg-black/10 backdrop-blur-sm shadow-lg",
          isMobile
            ? "aspect-video rounded-none min-h-[220px] h-[42%]"
            : "md:rounded-xl md:aspect-video h-[calc(100%)]",
        )}
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
                playbackId={TRANSFORMED_PLAYBACK_ID}
                autoPlay={true}
                muted={false}
                className="w-[120%] h-[120%] absolute left-[-10%] top-[-10%]"
                objectFit="cover"
                env="monster"
                lowLatency="force"
              />
            ) : (
              <iframe
                src={transformedIframeUrl}
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
                  playbackId={ORIGINAL_PLAYBACK_ID}
                  autoPlay={true}
                  muted={true}
                  className="w-full h-full"
                  env="studio"
                  lowLatency="force"
                />
              ) : (
                <iframe
                  src={originalIframeUrl}
                  className="w-full h-full"
                  style={{ overflow: "hidden" }}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  scrolling="no"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
