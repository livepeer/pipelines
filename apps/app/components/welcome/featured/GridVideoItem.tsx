"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@repo/design-system/lib/utils";
import Image from "next/image";

interface GridVideoItemProps {
  clip: any;
  onTryPrompt: (prompt: string) => void;
}

export const GridVideoItem = ({ clip, onTryPrompt }: GridVideoItemProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const hasThumbnail = clip.thumbnail_url || clip.poster_url;
  const thumbnailUrl = clip.thumbnail_url || clip.poster_url;

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
    if (!videoElement || !isNearViewport) return;

    if (isHovering) {
      videoElement.play().catch(error => {
        console.log("Browser is preventing video playback:", error);
      });
    } else {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
  }, [isNearViewport, isHovering]);

  return (
    <div
      ref={containerRef}
      className="aspect-square rounded-xl overflow-hidden relative cursor-pointer"
      onClick={() => {
        if (clip.prompt) {
          onTryPrompt(clip.prompt);
        }
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="absolute inset-px loading-gradient z-0"></div>
      <div className="absolute inset-px backdrop-blur-[125px] z-10"></div>

      {isNearViewport && (
        <>
          {hasThumbnail ? (
            <div
              className={cn(
                "absolute inset-0 w-full h-full z-20",
                isHovering ? "opacity-0" : "opacity-100",
                "transition-opacity duration-300",
              )}
            >
              <Image
                src={thumbnailUrl}
                alt={clip.prompt || "Video thumbnail"}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-top"
              />
            </div>
          ) : (
            <video
              src={`${clip.video_url}#t=0.5`}
              className={cn(
                "absolute inset-0 w-full h-full object-cover object-top z-20",
                isHovering ? "opacity-0" : "opacity-100",
                "transition-opacity duration-300",
              )}
              muted
              playsInline
              onLoadedData={() => setVideoLoaded(true)}
            />
          )}

          <video
            ref={videoRef}
            src={`${clip.video_url}#t=0.5`}
            muted
            loop
            playsInline
            onLoadedData={() => setIsLoaded(true)}
            className={cn(
              "absolute inset-0 w-full h-full object-cover object-top z-20",
              isHovering ? "opacity-100" : "opacity-0",
              !isLoaded && "opacity-0",
              "transition-opacity duration-300",
            )}
          />
        </>
      )}

      <div className="absolute bottom-3 left-3 right-3 p-0 z-30">
        <div className="text-white text-[0.64rem] bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
          {clip.prompt || "No prompt available"}
        </div>
      </div>
    </div>
  );
};
