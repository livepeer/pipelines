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
import { useGuestUserStore } from "@/hooks/useGuestUser";
import { GuestSignupModal } from "@/components/guest/GuestSignupModal";
import { BentoGridOverlay } from "./BentoGridOverlay";

interface DreamshaperProps {
  isGuestMode?: boolean;
}

export default function Dreamshaper({ isGuestMode = false }: DreamshaperProps) {
  useInitialization();
  useParamsHandling();
  useCapacityMonitor();

  const { handleStreamUpdate } = useStreamUpdates();
  const { stream, pipeline, sharedPrompt } = useDreamshaperStore();
  const { status, live } = useStreamStatus(stream?.id, false);
  const { currentStep, selectedPrompt, setSelectedPrompt } = useOnboard();
  const { setLastSubmittedPrompt, setHasSubmittedPrompt } = usePromptStore();
  const { user, authenticated, login } = usePrivy();
  const { isFullscreen } = useFullscreenStore();
  const playerRef = useRef<HTMLDivElement>(null);
  const {
    promptCount,
    incrementPromptCount,
    setHasRecordedClip,
    setHasShared,
    lastPrompt,
  } = useGuestUserStore();

  usePlayerPositionUpdater(playerRef);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestModalReason, setGuestModalReason] = useState<
    "prompt_limit" | "record_clip" | "share" | null
  >(null);

  useMount(() => {
    track("daydream_page_view", {
      is_authenticated: authenticated,
      is_guest_mode: isGuestMode,
    });
  });

  useEffect(() => {
    if (live) {
      track("daydream_stream_started", {
        is_authenticated: authenticated,
        playback_id: stream?.output_playback_id,
        stream_id: stream?.id,
        is_guest_mode: isGuestMode,
      });
    }
  }, [stream, live, isGuestMode]);

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
        is_guest_mode: isGuestMode,
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
          is_guest_mode: isGuestMode,
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
    isGuestMode,
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

  const handleGuestPromptSubmit = () => {
    if (isGuestMode) {
      if (promptCount >= 5) {
        setGuestModalReason("prompt_limit");
        setShowGuestModal(true);
        track("guest_prompt_limit_reached", {
          prompt_count: promptCount,
          last_prompt: lastPrompt,
        });
        return true;
      }

      incrementPromptCount();

      // Show signup modal after 5 prompts
      if (promptCount >= 4) {
        setGuestModalReason("prompt_limit");
        setShowGuestModal(true);
        track("guest_prompt_limit_reached", {
          prompt_count: promptCount + 1,
          last_prompt: lastPrompt,
        });
      }
    }
    return false;
  };

  const handleGuestShare = () => {
    if (isGuestMode) {
      setHasShared(true);
      setGuestModalReason("share");
      setShowGuestModal(true);
      track("guest_share_attempt", {
        prompt_count: promptCount,
        last_prompt: lastPrompt,
      });
      return true;
    }
    return false;
  };

  return (
    <div className="relative">
      <div className={currentStep !== "main" ? "hidden" : "block"}>
        <div className="relative flex flex-col min-h-screen overflow-y-auto">
          <Header isGuestMode={isGuestMode} onShareAttempt={handleGuestShare} />

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
          <InputPrompt onPromptSubmit={handleGuestPromptSubmit} />
          <StreamDebugPanel />
          <StreamInfo />
        </div>
      </div>

      {/* Guest user signup modal */}
      <GuestSignupModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        reason={guestModalReason}
      />

      {/* BentoGrid overlay for never-ending prompt cloning */}
      <BentoGridOverlay />
    </div>
  );
}
