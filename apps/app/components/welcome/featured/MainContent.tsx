"use client";

import { TrackedButton } from "@/components/analytics/TrackedButton";
import useFullscreenStore from "@/hooks/useFullscreenStore";
import useMobileStore from "@/hooks/useMobileStore";
import { useStreamStatus } from "@/hooks/useStreamStatus";
import { useTrialTimer } from "@/hooks/useTrialTimer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { Loader2, Maximize, Minimize } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useDreamshaperStore } from "../../../hooks/useDreamshaper";
import { LivepeerPlayer } from "./player";
import { usePrivy } from "@/hooks/usePrivy";
import { Logo } from "@/components/sidebar";
import Overlay from "./Overlay";
import { useStreamUpdates } from "@/hooks/useDreamshaper";
import { useSearchParams } from "next/navigation";
import { useGuestUserStore } from "@/hooks/useGuestUser";
import { usePromptStore } from "@/hooks/usePromptStore";

interface MainContentProps {
  stream: any;
  isGuestMode?: boolean;
  hasCapacity?: boolean;
}

export function MainContent({
  stream,
  isGuestMode = false,
  hasCapacity = true,
}: MainContentProps) {
  const { handleStreamUpdate } = useStreamUpdates();
  const { setLastSubmittedPrompt, setHasSubmittedPrompt } = usePromptStore();
  const { setLastPrompt, incrementPromptCount } = useGuestUserStore();
  const { authenticated } = usePrivy();
  const searchParams = useSearchParams();
  const inputPrompt = searchParams.get("inputPrompt");
  const { live, statusMessage } = useStreamStatus(stream?.id, false);
  const { isMobile } = useMobileStore();
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

  useEffect(() => {
    if (inputPrompt && handleStreamUpdate) {
      handleStreamUpdate(inputPrompt, { silent: true });
      setLastSubmittedPrompt(inputPrompt);
      setHasSubmittedPrompt(true);
      setLastPrompt(inputPrompt);

      if (!authenticated) {
        incrementPromptCount();
      }
    }
  }, [inputPrompt]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col">
        {/* Main content area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          {/* Your main content here */}
        </div>
      </div>

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

      {!authenticated && timeRemaining !== null && (
        <div className="hidden absolute top-5 right-16 bg-neutral-800/30 text-gray-400 px-5 py-1 text-xs rounded-full border border-gray-500 z-50">
          <span className="text-[10px] mr-2">left</span> {formattedTime}
        </div>
      )}

      {stream?.output_playback_id ? (
        <>
          <div className="relative w-full h-full">
            <LivepeerPlayer />
          </div>
          {(!live || showOverlay) && <Overlay statusMessage={statusMessage} />}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          Waiting for stream to start...
        </div>
      )}
    </div>
  );
}
