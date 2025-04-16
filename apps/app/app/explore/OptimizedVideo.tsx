import { usePreviewStore } from "@/hooks/usePreviewStore";
import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { Repeat, WandSparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import QuickviewVideo from "./QuickviewVideo";
import { hash } from "@/lib/hash";

interface OptimizedVideoProps {
  src: string;
  clipId: string;
  title: string;
  authorName: string;
  createdAt: string;
  remixCount: number;
  className?: string;
}

export default function OptimizedVideo({
  src,
  clipId,
  title,
  authorName,
  createdAt,
  remixCount,
  className,
}: OptimizedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPreviewOpen = usePreviewStore(state => state.isPreviewOpen);

  const shortSrc = src.replace(/\.mp4$/, "-short.mp4");

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

  // Effect to handle preview state changes
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPreviewOpen) {
      videoElement.pause();
    }
  }, [isPreviewOpen]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (
      !videoElement ||
      !containerRef.current ||
      !isNearViewport ||
      isPreviewOpen
    )
      return;

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
      { threshold: 0.9 },
    );

    playbackObserver.observe(containerRef.current);

    return () => playbackObserver.disconnect();
  }, [isNearViewport, isPreviewOpen]);

  return (
    <div ref={containerRef} className={cn("size-full", className)}>
      <QuickviewVideo
        src={src}
        clipId={clipId}
        title={title}
        authorName={authorName}
        createdAt={createdAt}
        remixCount={remixCount}
      >
        {isNearViewport ? (
          <div className="size-full relative">
            <video
              ref={videoRef}
              src={shortSrc}
              muted
              loop
              playsInline
              onLoadedData={() => setIsLoaded(true)}
              className={cn(
                "absolute inset-0 size-full object-cover object-top bg-transparent",
                !isLoaded && "opacity-0",
                "transition-opacity duration-300",
              )}
            />
            <div className="absolute bottom-3 left-3 p-0 z-10 flex gap-2 items-center">
              <img
                src={`https://picsum.photos/id/${hash(authorName)}/200/200`}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-white text-[0.64rem] bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                {authorName}
              </span>
            </div>

            <div className="absolute bottom-3 right-4 p-0 z-10 flex gap-1 items-center  bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg">
              <Repeat className="w-3 h-3 text-white" />
              <span className="text-white text-[0.64rem]">{remixCount}</span>
            </div>

            <div className="absolute top-3 right-3 p-0 z-10 flex gap-1 items-center">
              <button className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-sm text-white rounded-full hover:bg-black/90 transition-colors border-white border shadow-sm">
                <WandSparkles className="w-3 h-3" />
                <span className="text-[0.64rem] tracking-wide">Remix</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="size-full bg-transparent" />
        )}
      </QuickviewVideo>
    </div>
  );
}
