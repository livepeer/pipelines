import { GradientAvatar } from "@/components/GradientAvatar";
import { usePreviewStore } from "@/hooks/usePreviewStore";
import { useOverlayStore } from "@/hooks/useOverlayStore";
import { cn } from "@repo/design-system/lib/utils";
import { Repeat, WandSparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TrackedButton } from "@/components/analytics/TrackedButton";
import { useGuestUserStore } from "@/hooks/useGuestUser";
import { usePrivy } from "@/hooks/usePrivy";
import { useRouter } from "next/navigation";
import { setSourceClipIdToCookies } from "@/components/daydream/Clipping/actions";
import VideoAISparkles from "components/daydream/CustomIcons/VideoAISparkles";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";

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
  isOverlayMode?: boolean;
  onTryPrompt?: (prompt: string) => void;
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
  isOverlayMode = false,
  onTryPrompt,
}: OptimizedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isPreviewOpen } = usePreviewStore();
  const { setIsGuestUser, setLastPrompt } = useGuestUserStore();
  const { authenticated, ready } = usePrivy();
  const router = useRouter();
  const { isOverlayOpen } = useOverlayStore();

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

  const handleTryPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (prompt) {
      setLastPrompt(prompt);

      if (!authenticated && ready) {
        setIsGuestUser(true);
      }

      if (isOverlayMode && onTryPrompt) {
        onTryPrompt(prompt);
        await setSourceClipIdToCookies(clipId);
      } else {
        router.push(
          `/create?inputPrompt=${btoa(prompt)}&sourceClipId=${btoa(clipId)}`,
        );
      }
    } else {
      if (!isOverlayMode) {
        router.push("/create");
      }
    }
  };

  return (
    <div ref={containerRef} className={cn("size-full", className)}>
      {isNearViewport ? (
        <Link
          href={isOverlayMode ? "#" : `/clips/${slug || clipId}`}
          scroll={false}
          onClick={isOverlayMode ? e => e.preventDefault() : undefined}
        >
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

            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute bottom-3 right-4 p-0 z-10 flex gap-1 items-center  bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                    <Repeat className="w-3 h-3 text-white" />
                    <span className="text-white text-[0.64rem]">
                      {remixCount}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remixes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div
              className="absolute top-3 right-2 p-0 z-10 flex gap-1 items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150"
              onClick={e => e.stopPropagation()}
            >
              {isOverlayMode && onTryPrompt && prompt ? (
                <TrackedButton
                  trackingEvent="overlay_try_prompt_clicked"
                  trackingProperties={{ location: "overlay_video_card" }}
                  variant="outline"
                  className="inline-flex items-center space-x-0.5 px-3 py-2 h-8 bg-black/20 backdrop-blur-md text-white rounded-full border-white border shadow-sm scale-90"
                  onClick={handleTryPrompt}
                >
                  {/* Our default button overrides the size of child SVGs. Rather than change the button, I've overridden the CSS here. */}

                  <VideoAISparkles className={cn("!w-6 !h-6")} />
                  <span className="text-[0.7rem] tracking-wide">
                    Try this prompt
                  </span>
                </TrackedButton>
              ) : (
                <Link
                  href={
                    prompt
                      ? `/create?inputPrompt=${btoa(prompt)}&sourceClipId=${btoa(clipId)}`
                      : "/create"
                  }
                  onClick={e => {
                    e.stopPropagation();
                    if (prompt && !authenticated) {
                      setIsGuestUser(true);
                      setLastPrompt(prompt);
                    }
                  }}
                >
                  <TrackedButton
                    trackingEvent="explore_try_prompt_clicked"
                    trackingProperties={{ location: "video_card" }}
                    variant="outline"
                    className="inline-flex items-center space-x-0.5 px-3 py-2 h-8 bg-black/20 backdrop-blur-md text-white rounded-full border-white border shadow-sm scale-90"
                  >
                    {/* Our default button overrides the size of child SVGs. Rather than change the button, I've overridden the CSS here. */}

                    <VideoAISparkles className={cn("!w-6 !h-6")} />
                    <span className="text-[0.7rem] tracking-wide">
                      Try this prompt
                    </span>
                  </TrackedButton>
                </Link>
              )}
            </div>
          </div>
        </Link>
      ) : (
        <div className="size-full bg-transparent" />
      )}
    </div>
  );
}
