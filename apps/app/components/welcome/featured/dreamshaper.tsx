"use client";

import { TrackedButton } from "@/components/analytics/TrackedButton";
import { ClipButton } from "@/components/ClipButton";
import { useOnboard } from "@/components/daydream/OnboardContext";
import { StreamInfo } from "@/components/footer/stream-info";
import { StreamDebugPanel } from "@/components/stream/stream-debug-panel";
import useFullscreenStore from "@/hooks/useFullscreenStore";
import useMobileStore from "@/hooks/useMobileStore";
import { usePromptStore } from "@/hooks/usePromptStore";
import { useStreamStatus } from "@/hooks/useStreamStatus";
import { useTrialTimer } from "@/hooks/useTrialTimer";
import track from "@/lib/track";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@repo/design-system/components/ui/button";
import { Dialog } from "@repo/design-system/components/ui/dialog";
import { Separator } from "@repo/design-system/components/ui/separator";
import { SidebarTrigger } from "@repo/design-system/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { cn } from "@repo/design-system/lib/utils";
import {
  Loader2,
  Maximize,
  Minimize,
  Share,
  Share2,
  Users2,
} from "lucide-react";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { forwardRef, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useDreamshaperStore,
  useInitialization,
  useParamsHandling,
  useStreamUpdates,
} from "../../../hooks/useDreamshaper";
import { InputPrompt } from "./InputPrompt";
import { ManagedBroadcast } from "./ManagedBroadcast";
import { LivepeerPlayer } from "./player";
import { ShareModalContent, useShareModal } from "./ShareModal";

const MAX_STREAM_TIMEOUT_MS = 300000; // 5 minutes

const inter = Inter({ subsets: ["latin"] });

export default function Dreamshaper() {
  useInitialization();
  useParamsHandling();
  useCapacityMonitor();

  const { handleStreamUpdate } = useStreamUpdates();
  const { stream, pipeline, sharedPrompt } = useDreamshaperStore();
  const { status, live } = useStreamStatus(stream?.id, false);
  const { currentStep, selectedPrompt, setSelectedPrompt } = useOnboard();
  const { setLastSubmittedPrompt, setHasSubmittedPrompt } = usePromptStore();
  const { user, authenticated } = usePrivy();

  const outputPlayerRef = useRef<HTMLDivElement>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    track("daydream_page_view", {
      is_authenticated: authenticated,
    });
  }, []);

  useEffect(() => {
    if (live) {
      track("daydream_stream_started", {
        is_authenticated: authenticated,
        playback_id: stream?.output_playback_id,
        stream_id: stream?.id,
      });
    }
  }, [stream, live]);

  useEffect(() => {
    let pageLoadTime = Date.now();

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      setIsRefreshing(true);

      const eventData = {
        type: "app_user_page_unload",
        user_id: user?.id || "anonymous",
        is_authenticated: authenticated,
        stream_id: stream?.id,
        playback_id: stream?.output_playback_id,
        session_duration_ms: Date.now() - pageLoadTime,
        event_type: "unload",
      };

      if (navigator.sendBeacon) {
        const blob = new Blob(
          [
            JSON.stringify({
              eventType: "stream_trace",
              data: eventData,
              app: "daydream",
              host: window.location.hostname,
            }),
          ],
          { type: "application/json" },
        );

        navigator.sendBeacon("/api/metrics/beacon", blob);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && !isRefreshing) {
        // Commented for now - if we ever want to track page leave events
        /*const eventData = {
          type: "app_user_page_leave",
          user_id: user?.id || "anonymous",
          is_authenticated: authenticated,
          stream_id: streamId,
          playback_id: outputPlaybackId,
          session_duration_ms: Date.now() - pageLoadTime,
          event_type: "leave",
        };
        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify({
            eventType: "stream_trace",
            data: eventData,
            app: "daydream",
            host: window.location.hostname,
          })], { type: "application/json" });
          
          navigator.sendBeacon("/api/metrics/beacon", blob);
        }*/
      }

      if (document.visibilityState === "visible") {
        setIsRefreshing(false);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    authenticated,
    user,
    stream?.id,
    stream?.output_playback_id,
    isRefreshing,
  ]);

  useEffect(() => {
    if (selectedPrompt && status === "ONLINE") {
      if (handleStreamUpdate) {
        handleStreamUpdate(selectedPrompt, { silent: true });
      }
      setSelectedPrompt(null);
    }
  }, [selectedPrompt, status, handleStreamUpdate]);

  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  useEffect(() => {
    if (sharedPrompt) {
      setLastSubmittedPrompt(sharedPrompt);
      setHasSubmittedPrompt(true);
    }
  }, [sharedPrompt, setLastSubmittedPrompt]);

  useEffect(() => {
    if (pipeline?.prioritized_params) {
      console.log("Pipeline prioritized params:", pipeline.prioritized_params);
    } else {
      console.log("No pipeline prioritized params");
    }
  }, [pipeline]);

  return (
    <div className="relative">
      <div className={currentStep !== "main" ? "hidden" : ""}>
        <div className="relative flex flex-col min-h-screen overflow-y-auto">
          <Header />
          <MainContent ref={outputPlayerRef} />
          <ManagedBroadcast outputPlayerRef={outputPlayerRef} />
          <InputPrompt />
          <StreamDebugPanel />
          <StreamInfo />
        </div>
      </div>
    </div>
  );
}

const MainContent = forwardRef<HTMLDivElement>((_props, ref) => {
  const { stream, pipeline, loading } = useDreamshaperStore();
  const { live, statusMessage } = useStreamStatus(stream?.id, false);
  const { isMobile } = useMobileStore();
  const { authenticated } = usePrivy();
  const { timeRemaining, formattedTime } = useTrialTimer();
  const { isFullscreen, toggleFullscreen } = useFullscreenStore();

  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    if (live) {
      const timer = setTimeout(() => {
        setShowOverlay(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowOverlay(true);
    }
  }, [live]);

  return (
    <div
      className={cn(
        "px-4 my-4 flex items-center justify-center md:mb-0 md:my-2 mb-5",
        isFullscreen && "fixed inset-0 z-[9999] p-0 m-0",
      )}
    >
      <div
        ref={ref}
        className={cn(
          "w-full max-w-[calc(min(100%,calc((100vh-16rem)*16/9)))] mx-auto md:aspect-video aspect-square bg-sidebar rounded-2xl overflow-hidden relative",
          isFullscreen && "w-full h-full max-w-none rounded-none",
        )}
      >
        {/* Hide controls for mobile (TODO: when it's a react component,
          we can use the component's own controls - now it's an iframe) */}
        {isFullscreen && isMobile && (
          <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-background z-40" />
        )}

        {/* Go full screen */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="absolute top-4 right-4 z-50">
              <TrackedButton
                trackingEvent="daydream_fullscreen_button_clicked"
                trackingProperties={{
                  is_authenticated: authenticated,
                }}
                variant="ghost"
                size="icon"
                className="bg-transparent hover:bg-transparent focus:outline-none focus-visible:ring-0 active:bg-transparent"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </TrackedButton>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={5}
            className="bg-white text-black border border-gray-200 shadow-md dark:bg-zinc-900 dark:text-white dark:border-zinc-700"
          >
            {isFullscreen ? "Exit fullscreen" : "Expand screen"}
          </TooltipContent>
        </Tooltip>

        {/* Live indicator*/}
        {live && (
          <div className="absolute top-4 left-4 bg-neutral-800 text-gray-400 px-5 py-1 text-xs rounded-full border border-gray-500">
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            <span className="text-white font-bold">Live</span>
          </div>
        )}

        {/* Timer overlay */}
        {!authenticated && timeRemaining !== null && (
          <div className="absolute top-5 right-16 bg-neutral-800/30 text-gray-400 px-5 py-1 text-xs rounded-full border border-gray-500 z-50">
            <span className="text-[10px] mr-2">left</span> {formattedTime}
          </div>
        )}

        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : stream?.output_playback_id ? (
          <>
            <div className="relative w-full h-full">
              <LivepeerPlayer
                playbackId={stream?.output_playback_id}
                isMobile={isMobile}
                stream_key={stream?.stream_key}
                streamId={stream?.id as string}
                pipelineId={pipeline.id}
                pipelineType={pipeline.type}
                isFullscreen={isFullscreen}
              />
            </div>
            {!live || showOverlay ? (
              <div className="absolute inset-0 bg-black flex flex-col items-center justify-center rounded-2xl z-[6]">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                {statusMessage && (
                  <span className="mt-4 text-white text-sm">
                    {statusMessage}
                  </span>
                )}
              </div>
            ) : null}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Waiting for stream to start...
          </div>
        )}
      </div>
    </div>
  );
});

const Header = () => {
  const { authenticated } = usePrivy();
  const { isFullscreen } = useFullscreenStore();
  const { isMobile } = useMobileStore();
  const { stream, streamUrl } = useDreamshaperStore();
  const { live } = useStreamStatus(stream?.id);
  const { hasSubmittedPrompt } = usePromptStore();
  const { open, setOpen, openModal } = useShareModal();

  return (
    <>
      <div
        className={cn(
          "flex items-start mt-4 w-full max-w-[calc(min(100%,calc((100vh-16rem)*16/9)))] mx-auto relative",
          isFullscreen && "hidden",
          isMobile ? "justify-center px-3 py-3" : "justify-between py-3",
        )}
      >
        {isMobile && (
          <div className="absolute flex items-center left-2 top-7">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        )}
        <div
          className={cn(
            "flex flex-col gap-2",
            isMobile ? "text-center items-center" : "text-left items-start",
          )}
        >
          <h1
            className={cn(
              inter.className,
              "text-lg md:text-xl flex flex-col uppercase font-light",
              isMobile ? "items-center" : "items-start",
            )}
          >
            Daydream
            <div className="flex items-center gap-2 text-xs">
              <span className="uppercase text-xs">by</span>
              <span className="w-16">
                <Image
                  src="https://mintlify.s3.us-west-1.amazonaws.com/livepeer-ai/logo/light.svg"
                  alt="Livepeer logo"
                  width={100}
                  height={100}
                />
              </span>
            </div>
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground max-w-[280px] md:max-w-none">
            Transform your video in real-time with AI
          </p>
        </div>

        {/* Header buttons */}
        {!isMobile && !isFullscreen && (
          <div className="absolute bottom-3 right-0 flex gap-2">
            <div className="flex items-center gap-2">
              {/* Only show clip button when stream is live */}
              {live && stream?.output_playback_id && streamUrl && (
                <ClipButton
                  disabled={!stream?.output_playback_id || !streamUrl}
                  className="mr-2"
                  trackAnalytics={track}
                  isAuthenticated={authenticated}
                />
              )}
              <TrackedButton
                trackingEvent="daydream_share_button_clicked"
                trackingProperties={{
                  is_authenticated: authenticated,
                }}
                variant="ghost"
                size="sm"
                className="h-8 gap-2"
                onClick={openModal}
              >
                <Share className="h-4 w-4" />
                <span>Share</span>
              </TrackedButton>
            </div>

            <Link
              target="_blank"
              href="https://discord.com/invite/hxyNHeSzCK"
              className="bg-transparent hover:bg-black/10 border border-muted-foreground/30 text-foreground px-3 py-1 text-xs rounded-lg font-semibold h-[36px] flex items-center"
            >
              Join Community
            </Link>
          </div>
        )}
      </div>

      {isMobile && (
        <div className="z-50 flex gap-2 justify-end px-4 mt-2">
          {/* Mobile clip button - only show when live */}
          {live && stream?.output_playback_id && streamUrl && (
            <ClipButton
              disabled={!stream?.output_playback_id || !streamUrl}
              trackAnalytics={track}
              isAuthenticated={authenticated}
              isMobile={true}
            />
          )}

          {/* Mobile share button */}
          {hasSubmittedPrompt && (
            <Button
              variant="ghost"
              size="icon"
              className="p-0 m-0 bg-transparent border-none hover:bg-transparent focus:outline-none"
              onClick={openModal}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}

          <Link target="_blank" href="https://discord.com/invite/hxyNHeSzCK">
            <Button
              variant="ghost"
              size="icon"
              className="p-0 m-0 bg-transparent border-none hover:bg-transparent focus:outline-none"
            >
              <Users2 className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <ShareModalContent />
      </Dialog>
    </>
  );
};

export const useCapacityMonitor = () => {
  const { authenticated } = usePrivy();
  const { stream } = useDreamshaperStore();
  const { live, capacityReached } = useStreamStatus(stream?.id, false);

  const [timeoutReached, setTimeoutReached] = useState(false);
  const toastShownRef = useRef(false);

  const showCapacityToast = () => {
    track("capacity_reached", {
      is_authenticated: authenticated,
      stream_id: stream?.id,
    });
    toast("Platform at full capacity", {
      description: (
        <div className="flex flex-col gap-2">
          <p>
            We are currently at capacity, join the waitlist to use the platform
            in the future
          </p>
          <a
            href="https://www.livepeer.org/daydream-waitlist"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Join the waitlist
          </a>
        </div>
      ),
      duration: 1000000,
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!live) {
        setTimeoutReached(true);
      }
    }, MAX_STREAM_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [live]);

  useEffect(() => {
    if (
      (capacityReached || (timeoutReached && !live)) &&
      !toastShownRef.current
    ) {
      const reason = capacityReached
        ? "capacity_reached"
        : "timeout_reached_not_live";

      console.error("Capacity reached, reason:", reason, {
        capacityReached,
        timeoutReached,
        live,
      });

      track("daydream_capacity_reached", {
        is_authenticated: authenticated,
        reason,
        stream_id: stream?.id,
      });
      showCapacityToast();
      toastShownRef.current = true;
    }
  }, [capacityReached, timeoutReached, live, stream]);
};
