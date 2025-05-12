"use client";

import { useRef, useState } from "react";
import { cn } from "@repo/design-system/lib/utils";
import Image from "next/image";

interface GridVideoItemProps {
  clip: any;
  onTryPrompt: (prompt: string) => void;
}

export const GridVideoItem = ({ clip, onTryPrompt }: GridVideoItemProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const hasThumbnail = Boolean(clip.thumbnail_url);
  const isGoogleCloudStorage = clip.thumbnail_url?.includes(
    "storage.googleapis.com",
  );

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

      <div className="absolute inset-0 w-full h-full z-20">
        {hasThumbnail ? (
          isGoogleCloudStorage ? (
            <img
              src={clip.thumbnail_url}
              alt={clip.prompt || "Video thumbnail"}
              className={cn(
                "w-full h-full object-cover object-top",
                !isLoaded && "opacity-0",
                "transition-opacity duration-300",
              )}
              onLoad={() => setIsLoaded(true)}
            />
          ) : (
            <Image
              src={clip.thumbnail_url}
              alt={clip.prompt || "Video thumbnail"}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={cn(
                "object-cover object-top",
                !isLoaded && "opacity-0",
                "transition-opacity duration-300",
              )}
              onLoadingComplete={() => setIsLoaded(true)}
            />
          )
        ) : clip.video_url ? (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-sm text-white/80 p-2 text-center">
              <div className="w-8 h-8 mx-auto mb-1 bg-gray-700 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              </div>
              <div>
                {clip.prompt
                  ? `"${clip.prompt.substring(0, 30)}${clip.prompt.length > 30 ? "..." : ""}"`
                  : "No prompt available"}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-sm text-white/60">No preview</div>
          </div>
        )}
      </div>

      {isHovering && (
        <div className="absolute inset-0 bg-black/40 z-25 transition-opacity duration-300"></div>
      )}

      <div className="absolute bottom-3 left-3 right-3 p-0 z-30">
        <div
          className={cn(
            "text-white text-[0.64rem] bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg whitespace-nowrap overflow-hidden text-ellipsis max-w-full",
            isHovering ? "bg-black/70" : "bg-black/50",
          )}
        >
          {clip.prompt || "No prompt available"}
        </div>
      </div>
    </div>
  );
};
