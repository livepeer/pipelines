import { cn } from "@repo/design-system/lib/utils";
import { useEffect, useRef, useState } from "react";
import QuickviewVideo from "./QuickviewVideo";
import { usePreviewStore } from "@/hooks/usePreviewStore";

interface OptimizedVideoProps {
  src: string;
  clipId: string;
  className?: string;
}

export default function OptimizedVideo({
  src,
  clipId,
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
      { threshold: 0.7 },
    );

    playbackObserver.observe(containerRef.current);

    return () => playbackObserver.disconnect();
  }, [isNearViewport, isPreviewOpen]);

  return (
    <div ref={containerRef} className={cn("size-full", className)}>
      <QuickviewVideo src={src} clipId={clipId}>
        {isNearViewport ? (
          <video
            ref={videoRef}
            src={shortSrc}
            muted
            loop
            playsInline
            onLoadedData={() => setIsLoaded(true)}
            className={cn(
              "size-full object-cover object-top bg-transparent",
              !isLoaded && "opacity-0",
            )}
          />
        ) : (
          <div className="size-full bg-transparent" />
        )}
      </QuickviewVideo>
    </div>
  );
}
