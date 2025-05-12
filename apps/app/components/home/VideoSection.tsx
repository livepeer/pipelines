"use client";

import React, { useState, useEffect } from "react";

export function VideoSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [transformedLoading, setTransformedLoading] = useState(true);

  const ORIGINAL_PLAYBACK_ID = "95705ossoplg7uvq";
  const TRANSFORMED_PLAYBACK_ID = "85c28sa2o8wppm58";
  const originalIframeUrl = `https://monster.lvpr.tv/?v=${ORIGINAL_PLAYBACK_ID}&lowLatency=force&backoffMax=1000&ingestPlayback=true`;
  const transformedIframeUrl = `https://lvpr.tv/?v=${TRANSFORMED_PLAYBACK_ID}&lowLatency=false&backoffMax=1000&ingestPlayback=true&muted=true&autoplay=true&controls=false`;

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

      <div className="w-full h-full relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <iframe
            src={originalIframeUrl}
            className="absolute w-[120%] h-[120%] left-[-10%] top-[-10%] md:w-[120%] md:h-[120%] md:left-[-10%] md:top-[-10%]"
            style={{ overflow: "hidden" }}
            allow="autoplay; fullscreen"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
            scrolling="no"
          />
        </div>

        <div className="absolute bottom-4 left-4 w-[25%] aspect-video z-30 rounded-lg overflow-hidden border-2 border-white/30 shadow-lg hidden md:block">
          {transformedLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <iframe
            src={transformedIframeUrl}
            className="absolute w-[140%] h-[140%] left-[-20%] top-[-20%]"
            style={{ overflow: "hidden" }}
            allow="autoplay"
            onLoad={() => setTransformedLoading(false)}
            scrolling="no"
          />
          <div className="absolute inset-0 z-10" />
        </div>

        <div className="absolute inset-0 z-20 pointer-events-auto bg-transparent"></div>
      </div>
    </div>
  );
}
