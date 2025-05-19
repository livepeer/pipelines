"use client";

import { TrackedButton } from "@/components/analytics/TrackedButton";
import useFullscreenStore from "@/hooks/useFullscreenStore";
import useMobileStore from "@/hooks/useMobileStore";
import { usePrivy } from "@/hooks/usePrivy";
import { useTrialTimer } from "@/hooks/useTrialTimer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { Loader2, Maximize, Minimize } from "lucide-react";
import { useDreamshaperStore } from "../../../hooks/useDreamshaper";
import Overlay from "./Overlay";
import { LivepeerPlayer, usePlayerStore } from "./player";

export const MainContent = () => {
  const { stream, loading } = useDreamshaperStore();
  const { isMobile } = useMobileStore();
  const { authenticated } = usePrivy();
  const { timeRemaining, formattedTime } = useTrialTimer();
  const { isPlaying } = usePlayerStore();
  const { isFullscreen, toggleFullscreen } = useFullscreenStore();

  return (
    <>
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
      {isPlaying && (
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

      {loading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="relative w-full h-full">
            <LivepeerPlayer />
          </div>
          {!isPlaying && <Overlay />}
        </>
      )}
    </>
  );
};
