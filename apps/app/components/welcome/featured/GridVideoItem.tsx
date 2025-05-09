"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@repo/design-system/lib/utils";

interface GridVideoItemProps {
  clip: any;
  onTryPrompt: (prompt: string) => void;
}

export const GridVideoItem = ({ clip, onTryPrompt }: GridVideoItemProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    videoElement.play().catch(error => {
      console.log("Browser is preventing autoplay:", error);
    });
  }, []);
  
  return (
    <div 
      className="aspect-square rounded-xl overflow-hidden relative cursor-pointer"
      onClick={() => {
        if (clip.prompt) {
          onTryPrompt(clip.prompt);
        }
      }}
    >
      <div className="absolute inset-px loading-gradient z-0"></div>
      <div className="absolute inset-px backdrop-blur-[125px] z-10"></div>
      <video
        ref={videoRef}
        src={`${clip.video_url}#t=0.5`}
        muted
        loop
        playsInline
        onLoadedData={() => setIsLoaded(true)}
        className={cn(
          "absolute inset-0 w-full h-full object-cover object-top z-20",
          !isLoaded && "opacity-0",
          "transition-opacity duration-300"
        )}
      />
      <div className="absolute bottom-3 left-3 p-0 z-30 flex gap-2 items-center">
        <span className="text-white text-[0.64rem] bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg">
          {clip.author_name || "Livepeer"}
        </span>
      </div>
    </div>
  );
}; 