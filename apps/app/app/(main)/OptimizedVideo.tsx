import { GradientAvatar } from "@/components/GradientAvatar";
import { usePreviewStore } from "@/hooks/usePreviewStore";
import { cn } from "@repo/design-system/lib/utils";
import { Repeat, WandSparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TrackedButton } from "@/components/analytics/TrackedButton";

interface OptimizedVideoProps {
  src: string;
  clipId: string;
  prompt?: string;
  title: string;
  slug: string | null;
  authorName: string;
  createdAt: string;
  remixCount: number;
  className?: string;
}

export default function OptimizedVideo({
  src,
  clipId,
  prompt,
  title,
  slug,
  authorName,
  createdAt,
  remixCount,
  className,
}: OptimizedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isPreviewOpen } = usePreviewStore();

  const shortSrc = src.replace(/\.mp4$/, "-short.mp4");
  const [effectiveSrc, setEffectiveSrc] = useState(shortSrc);

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

  const handleVideoError = () => {
    console.log(
      `Short video not found for ${shortSrc}, falling back to ${src}`,
    );
    setEffectiveSrc(src);
  };

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
      { threshold: 0.5 },
    );

    playbackObserver.observe(containerRef.current);

    return () => playbackObserver.disconnect();
  }, [isNearViewport, isPreviewOpen]);

  return (
    <div ref={containerRef} className={cn("size-full", className)}>
      {isNearViewport ? (
        <Link href={`/clips/${slug || clipId}`} scroll={false}>
          <div className="size-full relative group">
            <video
              ref={videoRef}
              src={effectiveSrc + "#t=0.5"}
              muted
              loop
              playsInline
              onLoadedData={() => setIsLoaded(true)}
              onError={handleVideoError}
              className={cn(
                "absolute inset-0 size-full object-cover object-top bg-transparent",
                !isLoaded && "opacity-0",
                "transition-opacity duration-300",
              )}
            />
            <div className="absolute bottom-3 left-3 p-0 z-10 flex gap-2 items-center">
              <GradientAvatar seed={authorName} size={24} className="h-6 w-6" />
              <span className="text-white text-[0.64rem] bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                {authorName}
              </span>
            </div>
            {/* 
            <div className="absolute bottom-3 right-4 p-0 z-10 flex gap-1 items-center  bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg">
              <Repeat className="w-3 h-3 text-white" />
              <span className="text-white text-[0.64rem]">{remixCount}</span>
            </div> */}

            <div
              className="absolute top-3 right-2 p-0 z-10 flex gap-1 items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150"
              onClick={e => e.stopPropagation()}
            >
              <Link
                href={
                  prompt ? `/create?inputPrompt=${btoa(prompt)}` : "/create"
                }
              >
                <TrackedButton
                  trackingEvent="explore_try_prompt_clicked"
                  trackingProperties={{ location: "video_card" }}
                  variant="outline"
                  className="inline-flex items-center space-x-0.5 px-3 py-2 h-8 bg-black/20 backdrop-blur-md text-white rounded-full border-white border shadow-sm scale-90"
                >
                  <WandSparkles className="w-1.5 h-1.5" />
                  <span className="text-[0.7rem] tracking-wide">
                    Try this prompt
                  </span>
                </TrackedButton>
              </Link>
            </div>
          </div>
        </Link>
      ) : (
        <div className="size-full bg-transparent" />
      )}
    </div>
  );
}
