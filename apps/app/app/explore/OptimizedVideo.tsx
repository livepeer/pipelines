import { cn } from "@repo/design-system/lib/utils";
import { useEffect, useRef, useState } from "react";

interface OptimizedVideoProps {
  src: string;
  className?: string;
}

export default function OptimizedVideo({
  src,
  className,
}: OptimizedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
            console.log("Browser is prevnting autoplay:", error);
          });
        } else {
          videoElement.pause();
        }
      },
      { threshold: 0.7 },
    );

    playbackObserver.observe(containerRef.current);

    return () => playbackObserver.disconnect();
  }, [isNearViewport]);

  return (
    <div ref={containerRef} className={cn("size-full", className)}>
      {isNearViewport ? (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          className="size-full object-cover object-top"
        />
      ) : (
        <div className="size-full bg-gray-100" />
      )}
    </div>
  );
}
