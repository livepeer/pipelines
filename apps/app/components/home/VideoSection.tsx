"use client";

import React, { useState, useEffect } from "react";
import { LivepeerPlayer } from "./LivepeerPlayer";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { Button } from "@repo/design-system/components/ui/button";

export function VideoSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [useLivepeerPlayer, setUseLivepeerPlayer] = useState(false);

  const TRANSFORMED_PLAYBACK_ID = "95705ossoplg7uvq";
  const ORIGINAL_PLAYBACK_ID = "85c28sa2o8wppm58";
  const transformedIframeUrl = `https://monster.lvpr.tv/?v=${TRANSFORMED_PLAYBACK_ID}&lowLatency=force&backoffMax=1000&ingestPlayback=true`;
  const originalIframeUrl = `https://lvpr.tv/?v=${ORIGINAL_PLAYBACK_ID}&lowLatency=false&backoffMax=1000&ingestPlayback=true&muted=true`;

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

  const handleJoinDiscordClick = () => {
    window.open("https://discord.gg/5sZu8xmn6U", "_blank");
  };

  return (
    <div className="flex flex-col w-full md:w-[70%]">
      <div className="w-full py-3 px-4 hidden md:flex items-center justify-between">
        <h1
          className="text-4xl md:text-[36px] font-bold tracking-widest italic"
          style={{ color: "#000000" }}
        >
          DAYDREAM
        </h1>
        <Button
          className="px-4 py-2 h-10 rounded-md bg-white text-black hover:bg-gray-100 flex items-center justify-center gap-2"
          onClick={handleJoinDiscordClick}
        >
          <DiscordLogoIcon className="h-4 w-4" />
          Join Discord
        </Button>
      </div>

      <div className="w-full relative md:rounded-lg overflow-hidden bg-black/10 backdrop-blur-sm shadow-lg md:aspect-video h-[calc(100%-65px)]">
        <div className="absolute top-3 left-3 z-20 md:hidden">
          <h1
            className="text-4xl md:text-[36px] font-bold tracking-widest italic mix-blend-difference"
            style={{ color: "rgba(255, 255, 255, 0.65)" }}
          >
            DAYDREAM
          </h1>
        </div>

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

          <div className="absolute bottom-4 left-4 w-[25%] aspect-video z-30 rounded-lg overflow-hidden border-2 border-white/30 shadow-lg hidden md:block">
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

          <div className="absolute inset-0 z-20 pointer-events-auto bg-transparent"></div>
        </div>
      </div>
    </div>
  );
}
