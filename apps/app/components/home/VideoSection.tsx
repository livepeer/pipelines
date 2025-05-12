"use client";

import React, { useState } from "react";

export function VideoSection() {
  const [isLoading, setIsLoading] = useState(true);

  const PLAYBACK_ID = "3150onhrqxekpmon";
  const iframeUrl = `https://monster.lvpr.tv/?v=${PLAYBACK_ID}&lowLatency=force&backoffMax=1000&ingestPlayback=true`;

  return (
    <div className="w-full md:w-[70%] relative md:rounded-lg overflow-hidden bg-black/10 backdrop-blur-sm shadow-lg md:aspect-video h-full md:h-full md:relative">
      <div className="absolute top-3 left-3 z-20 hidden md:block">
        <h1
          className="text-4xl md:text-[36px] font-bold tracking-widest italic mix-blend-difference"
          style={{ color: "rgba(255, 255, 255, 0.65)" }}
        >
          DAYDREAM
        </h1>
      </div>

      <div className="w-full h-full relative md:relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <iframe
          src={iframeUrl}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}
