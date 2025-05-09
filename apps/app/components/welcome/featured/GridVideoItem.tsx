"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@repo/design-system/lib/utils";

interface GridVideoItemProps {
  clip: any;
  onTryPrompt: (prompt: string) => void;
}

export const GridVideoItem = ({ clip, onTryPrompt }: GridVideoItemProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const nearObserver = new IntersectionObserver(
      entries => {
        setIsNearViewport(entries[0].isIntersecting);
      },
      { rootMargin: "1000px" },
    );

    nearObserver.observe(containerRef.current);

    return () => nearObserver.disconnect();
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !containerRef.current || !isNearViewport) return;

    const playbackObserver = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          videoElement.play().catch(error => {
            console.log("Browser is preventing autoplay:", error);
          });
        } else {
          videoElement.pause();
        }
      },
      { threshold: 0.5 },
    );

    playbackObserver.observe(containerRef.current);

    return () => playbackObserver.disconnect();
  }, [isNearViewport]);

  return (
    <div
      ref={containerRef}
      className="aspect-square rounded-xl overflow-hidden relative cursor-pointer"
      onClick={() => {
        if (clip.prompt) {
          onTryPrompt(clip.prompt);
        }
      }}
    >
      <div className="absolute inset-px loading-gradient z-0"></div>
      <div className="absolute inset-px backdrop-blur-[125px] z-10"></div>
      {isNearViewport ? (
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
            "transition-opacity duration-300",
          )}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-transparent z-20" />
      )}
      <div className="absolute bottom-3 left-3 p-0 z-30 flex gap-2 items-center">
        <span className="text-white text-[0.64rem] bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg">
          {clip.author_name || "Livepeer"}
        </span>
      </div>
    </div>
  );
};
