"use client";

import { useOnboard } from "@/components/daydream/OnboardContext";
import { StreamInfo } from "@/components/footer/stream-info";
import { StreamDebugPanel } from "@/components/stream/stream-debug-panel";
import {
  useErrorMonitor,
  useDreamshaperStore,
  useInitialization,
  useParamsHandling,
  useStreamUpdates,
  CACHED_PARAMS_PIPELINE_ID_KEY,
} from "@/hooks/useDreamshaper";
import useFullscreenStore from "@/hooks/useFullscreenStore";
import useMobileStore from "@/hooks/useMobileStore";
import { usePromptStore } from "@/hooks/usePromptStore";
import { useStreamStatus } from "@/hooks/useStreamStatus";
import track from "@/lib/track";
import { cn } from "@repo/design-system/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Header } from "./Header";
import { ResponsiveInputPrompt } from "./ResponsiveInputPrompt";
import { MainContent } from "./MainContent";
import { ManagedBroadcast } from "./ManagedBroadcast";
import { usePrivy } from "@/hooks/usePrivy";
import useMount from "@/hooks/useMount";
import { sendBeaconEvent } from "@/lib/analytics/event-middleware";
import { useGuestUserStore } from "@/hooks/useGuestUser";
import { BentoGridOverlay } from "./BentoGridOverlay";
import { useTrialTimer } from "@/hooks/useTrialTimer";
import { UnifiedSignupModal } from "@/components/modals/unified-signup-modal";
import { TutorialVideo, useTutorialVideoStore } from "./TutorialVideo";
import {
  DREAMSHAPER_PARAMS_STORAGE_KEY,
  DREAMSHAPER_PARAMS_VERSION_KEY,
} from "@/hooks/useDreamshaper";
import { PlayerOverlay } from "./PlayerOverlay";
import { usePlayerStore } from "./player";
import { useOverlayStore } from "@/hooks/useOverlayStore";
import { usePlayerPositionUpdater } from "./usePlayerPosition";

interface DreamshaperProps {
  isGuestMode?: boolean;
  defaultPrompt?: string | null;
}

export default function Dreamshaper({
  isGuestMode = false,
  defaultPrompt = null,
}: DreamshaperProps) {
  const { capacityLoading, hasCapacity } = useInitialization();
  useParamsHandling();
  useErrorMonitor();

  const { isVisible } = useTutorialVideoStore();
  const { handleStreamUpdate } = useStreamUpdates();
  const { stream, pipeline, sharedPrompt, errorState } = useDreamshaperStore();
  const { status } = useStreamStatus(stream?.id, false);
  const { isPlaying } = usePlayerStore();
  const { currentStep, selectedPrompt, setSelectedPrompt } = useOnboard();
  const { lastSubmittedPrompt, setLastSubmittedPrompt, setHasSubmittedPrompt } =
    usePromptStore();
  const { user, authenticated, login, ready } = usePrivy();
  const { isFullscreen } = useFullscreenStore();
  const playerRef = useRef<HTMLDivElement>(null);
  const {
    promptCount,
    incrementPromptCount,
    setHasRecordedClip,
    setHasShared,
    lastPrompt,
    setLastPrompt,
  } = useGuestUserStore();
  const { timeRemaining } = useTrialTimer();
  const { isOverlayOpen } = useOverlayStore();
  const { isMobile } = useMobileStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupModalReason, setSignupModalReason] = useState<
    "trial_expired" | "prompt_limit" | "share" | null
  >(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [forceError, setForceError] = useState(false);

  useMount(() => {
    track("daydream_page_view", {
      is_authenticated: authenticated,
      is_guest_mode: isGuestMode,
    });

    const searchParams = new URL(window.location.href).searchParams;
    const hasInputPrompt = searchParams.has("inputPrompt");
    const hasSharedParam = searchParams.has("shared");
    const hasForceError = searchParams.get("forceError") === "true";

    setForceError(hasForceError);

    if (hasInputPrompt || hasSharedParam) {
      localStorage.removeItem(DREAMSHAPER_PARAMS_STORAGE_KEY);
      localStorage.removeItem(DREAMSHAPER_PARAMS_VERSION_KEY);
      localStorage.removeItem(CACHED_PARAMS_PIPELINE_ID_KEY);
    }
  });

  useEffect(() => {
    if (isPlaying) {
      track("daydream_stream_started", {
        is_authenticated: authenticated,
        playback_id: stream?.output_playback_id,
        stream_id: stream?.id,
        is_guest_mode: isGuestMode,
      });
    }
  }, [stream, isPlaying, isGuestMode]);

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
    const handleTrialExpired = () => {
      setSignupModalReason("trial_expired");
      setShowSignupModal(true);

      track("trial_expired_event", {
        is_guest_mode: isGuestMode,
        prompt_count: promptCount,
        last_prompt: lastPrompt,
      });
    };

    window.addEventListener("trialExpired", handleTrialExpired);

    const timeRemainingValue = localStorage.getItem(
      "unregistered_time_remaining",
    );
    if (timeRemainingValue === "0" && !authenticated && ready) {
      setSignupModalReason("trial_expired");
      setShowSignupModal(true);

      track("trial_expired_check", {
        is_guest_mode: isGuestMode,
        prompt_count: promptCount,
        last_prompt: lastPrompt,
        source: "initial_load",
      });
    }

    return () => {
      window.removeEventListener("trialExpired", handleTrialExpired);
    };
  }, [authenticated, isGuestMode, promptCount, lastPrompt]);

  useEffect(() => {
    if (timeRemaining === 0 && !authenticated) {
      setSignupModalReason("trial_expired");
      setShowSignupModal(true);

      track("trial_expired_timer", {
        is_guest_mode: isGuestMode,
        prompt_count: promptCount,
        last_prompt: lastPrompt,
        source: "timer",
      });
    }
  }, [timeRemaining, authenticated, isGuestMode, promptCount, lastPrompt]);

  useEffect(() => {
    const hasSeen = localStorage.getItem("has_seen_tutorial");
    if (isGuestMode && !hasSeen) {
      setShowTutorial(true);
    }
  }, [isGuestMode]);

  useEffect(() => {
    const searchParams = new URL(window.location.href).searchParams;
    const inputPromptB64 = searchParams.get("inputPrompt");

    if (inputPromptB64 && showTutorial) {
      try {
        const decodedPrompt = atob(inputPromptB64);
        setLastSubmittedPrompt(decodedPrompt);
        setHasSubmittedPrompt(true);
      } catch (error) {
        console.error("Error decoding input prompt:", error);
      }
    }
  }, [isPlaying, showTutorial, setLastSubmittedPrompt, setHasSubmittedPrompt]);

  useEffect(() => {
    const searchParams = new URL(window.location.href).searchParams;
    const inputPromptB64 = searchParams.get("inputPrompt");
    if (inputPromptB64 && isPlaying) {
      try {
        const decodedPrompt = atob(inputPromptB64);
        setLastSubmittedPrompt(decodedPrompt);
        setHasSubmittedPrompt(true);
      } catch (error) {
        console.error("Error decoding input prompt:", error);
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!capacityLoading && !hasCapacity) {
      track("capacity_check_failed", {
        is_authenticated: authenticated,
        is_guest_mode: isGuestMode,
      });
    }
  }, [capacityLoading, hasCapacity, authenticated, isGuestMode]);

  useEffect(() => {
    if (
      isGuestMode &&
      defaultPrompt &&
      status === "ONLINE" &&
      handleStreamUpdate
    ) {
      setTimeout(() => {
        handleStreamUpdate(defaultPrompt);
        setLastPrompt(defaultPrompt);
        setLastSubmittedPrompt(defaultPrompt);
        setHasSubmittedPrompt(true);

        track("guest_default_prompt_applied", {
          prompt: defaultPrompt,
          from_homepage: true,
        });
      }, 1500);
    }
  }, [
    isGuestMode,
    defaultPrompt,
    status,
    handleStreamUpdate,
    setLastPrompt,
    setLastSubmittedPrompt,
    setHasSubmittedPrompt,
  ]);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem("has_seen_tutorial", "true");

    if (lastSubmittedPrompt && handleStreamUpdate) {
      handleStreamUpdate(lastSubmittedPrompt, { silent: true });
    }
  };

  const handleGuestPromptSubmit = () => {
    if (isGuestMode) {
      if (promptCount >= 5) {
        setSignupModalReason("prompt_limit");
        setShowSignupModal(true);
        track("guest_prompt_limit_reached", {
          prompt_count: promptCount,
          last_prompt: lastPrompt,
        });
        return true;
      }

      incrementPromptCount();

      if (promptCount >= 4) {
        setSignupModalReason("prompt_limit");
        setShowSignupModal(true);
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
      setSignupModalReason("share");
      setShowSignupModal(true);
      track("guest_share_attempt", {
        prompt_count: promptCount,
        last_prompt: lastPrompt,
      });
      return true;
    }
    return false;
  };

  usePlayerPositionUpdater(playerRef);

  useEffect(() => {
    if (authenticated && ready && showSignupModal) {
      setShowSignupModal(false);
    }
  }, [authenticated, ready, showSignupModal]);

  const [confirmedShow, setConfirmedShow] = useState(false);

  useEffect(() => {
    if (showSignupModal) {
      const timer = setTimeout(() => {
        if (!authenticated && ready) {
          setConfirmedShow(true);
        } else {
          setShowSignupModal(false);
        }
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setConfirmedShow(false);
    }
  }, [showSignupModal, authenticated, ready]);

  if (showSignupModal) {
    console.log("showSignupModal", authenticated, ready, showSignupModal);
    if (authenticated && ready) {
      setShowSignupModal(false);
      return null;
    }

    if (!confirmedShow) return null;

    return (
      <div className="flex-1 flex flex-col pb-6 md:pb-0 h-screen overflow-y-auto">
        <UnifiedSignupModal
          open={showSignupModal}
          onOpenChange={setShowSignupModal}
          reason={signupModalReason}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-6 md:pb-0 h-screen overflow-y-auto">
      <div
        className={cn(
          currentStep !== "main" ? "hidden" : "block",
          isOverlayOpen && !isMobile && "transition-all duration-200 pr-[38%]",
        )}
      >
        <div className="relative flex flex-col min-h-screen overflow-y-auto">
          <div
            className={cn(
              "pt-1",
              !isMobile && "px-4 mb-3",
              !hasCapacity ? "opacity-0 pointer-events-none" : "opacity-100",
            )}
          >
            <Header
              isGuestMode={isGuestMode}
              onShareAttempt={handleGuestShare}
            />
          </div>

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
                isOverlayOpen && !isMobile && "md:aspect-auto md:h-[70vh]",
              )}
            >
              {hasCapacity ? (
                <>
                  {(!showTutorial || !isVisible) && <MainContent />}
                  {showTutorial && (
                    <TutorialVideo onComplete={handleTutorialComplete} />
                  )}
                </>
              ) : (
                <PlayerOverlay isLoading={capacityLoading} />
              )}

              {(forceError || errorState) && (
                <PlayerOverlay isLoading={capacityLoading} error={true} />
              )}
            </div>
          </div>

          {/* Input and Broadcast Section */}
          <div
            className={
              !hasCapacity ? "opacity-0 pointer-events-none" : "opacity-100"
            }
          >
            {!showTutorial && <ManagedBroadcast />}
            {!showTutorial && (
              <ResponsiveInputPrompt onPromptSubmit={handleGuestPromptSubmit} />
            )}
          </div>
          <StreamDebugPanel />
        </div>
      </div>

      {/* BentoGrid overlay for never-ending prompt cloning */}
      <div
        className={
          !hasCapacity ? "opacity-0 pointer-events-none" : "opacity-100"
        }
      >
        <BentoGridOverlay />
      </div>
    </div>
  );
}
