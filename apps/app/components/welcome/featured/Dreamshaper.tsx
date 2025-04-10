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
import { usePrivy } from "@/hooks/usePrivy";
import useMount from "@/hooks/useMount";
import { sendBeaconEvent } from "@/lib/analytics/event-middleware";

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
    // Track page unload events
    const handleUnload = () => {
      setIsRefreshing(true);

      const eventData = {
        type: "app_user_page_unload",
        is_authenticated: authenticated,
        stream_id: stream?.id,
        playback_id: stream?.output_playback_id,
        pipeline_id: pipeline?.id,
        event_type: "unload",
      };

      sendBeaconEvent(
        "stream_trace",
        eventData,
        "daydream",
        window.location.hostname,
        user || undefined,
      );
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && !isRefreshing) {
        const eventData = {
          type: "app_user_page_visibility_change",
          is_authenticated: authenticated,
          stream_id: stream?.id,
          playback_id: stream?.output_playback_id,
          pipeline_id: pipeline?.id,
          event_type: "visibility_change",
        };

        sendBeaconEvent(
          "stream_trace",
          eventData,
          "daydream",
          window.location.hostname,
          user || undefined,
        );
      }

      if (document.visibilityState === "visible") {
        setIsRefreshing(false);
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    authenticated,
    user,
    stream?.id,
    stream?.output_playback_id,
    pipeline?.id,
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
                "md:min-w-[596px]",
              )}
            >
              <MainContent />
            </div>
          </div>

          {/* Input and Broadcast Section */}
          <ManagedBroadcast />
          <InputPrompt />
          <StreamDebugPanel />
          <StreamInfo />
        </div>
      </div>
    </div>
  );
}
