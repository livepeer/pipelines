"use client";

import { useOnboard } from "@/components/daydream/OnboardContext";
import { StreamInfo } from "@/components/footer/stream-info";
import { StreamDebugPanel } from "@/components/stream/stream-debug-panel";
import {
  useCapacityMonitor,
  useDreamshaperStore,
  useInitialization,
  useParamsHandling,
  useStreamUpdates,
} from "@/hooks/useDreamshaper";
import useFullscreenStore from "@/hooks/useFullscreenStore";
import useMobileStore from "@/hooks/useMobileStore";
import useMount from "@/hooks/useMount";
import { usePrivy } from "@/hooks/usePrivy";
import { usePromptStore } from "@/hooks/usePromptStore";
import { useStreamStatus } from "@/hooks/useStreamStatus";
import track from "@/lib/track";
import { cn } from "@repo/design-system/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Header } from "./Header";
import { InputPrompt } from "./InputPrompt";
import { MainContent } from "./MainContent";
import { ManagedBroadcast } from "./ManagedBroadcast";
import { usePlayerPositionUpdater } from "./usePlayerPosition";

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
  const { isFullscreen } = useFullscreenStore();
  const { isMobile } = useMobileStore();
  const playerRef = useRef<HTMLDivElement>(null);

  usePlayerPositionUpdater(playerRef);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useMount(() => {
    track("daydream_page_view", {
      is_authenticated: authenticated,
    });
  });

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

  useMount(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  });

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
      <div className={currentStep !== "main" ? "hidden" : "block"}>
        <div className="relative flex flex-col min-h-screen overflow-y-auto">
          <Header />

          <div
            className={cn(
              "px-4 my-4 flex items-center justify-center md:mb-0 md:my-2 mb-5",
              isFullscreen && "fixed inset-0 z-[9999] p-0 m-0",
            )}
          >
            <div
              ref={playerRef}
              className={cn(
                "w-full max-w-[calc(min(100%,calc((100vh-16rem)*16/9)))] mx-auto md:aspect-video aspect-square bg-sidebar rounded-2xl overflow-hidden relative",
                isFullscreen && "w-full h-full max-w-none rounded-none",
              )}
            >
              <MainContent />
            </div>
          </div>

          {/* Input and Broadcast Section */}
          <ManagedBroadcast />

          <div className={cn("px-4", !isFullscreen && "z-50")}>
            <div
              className={cn(
                "space-y-5 md:space-y-8 mt-4",
                "w-full md:max-w-[calc(min(100%,calc((100vh-16rem)*16/9)))] md:px-6 mx-auto mb-0",

                isFullscreen && "z-[10000] fixed left-1/2 -translate-x-1/2",
                isFullscreen &&
                  isMobile &&
                  "bottom-[calc(env(safe-area-inset-bottom)+16px)]",
                isFullscreen && !isMobile && "bottom-0",
                !isFullscreen && "md:-translate-y-24 md:mt-0",
              )}
            >
              <InputPrompt />
            </div>
          </div>

          <StreamDebugPanel />
          <StreamInfo />
        </div>
      </div>
    </div>
  );
}
