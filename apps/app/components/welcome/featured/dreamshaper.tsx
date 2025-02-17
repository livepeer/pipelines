"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { examplePrompts } from "./interstitial";
import { TooltipTrigger } from "@repo/design-system/components/ui/tooltip";
import { TooltipContent } from "@repo/design-system/components/ui/tooltip";
import { Tooltip } from "@repo/design-system/components/ui/tooltip";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
} from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { BroadcastWithControls } from "@/components/playground/broadcast";
import { Loader2, Maximize, Minimize } from "lucide-react";
import { LPPLayer } from "@/components/playground/player";
import { useIsMobile } from "@repo/design-system/hooks/use-mobile";
import { usePrivy } from "@privy-io/react-auth";
import { useTrialTimer } from "@/hooks/useTrialTimer";
import { cn } from "@repo/design-system/lib/utils";
import { UpdateOptions } from "./useDreamshaper";
import Link from "next/link";
import { Separator } from "@repo/design-system/components/ui/separator";
import TextareaAutosize from "react-textarea-autosize";
import useKeyboardOffset from "./useKeyboardOffset";

const PROMPT_INTERVAL = 4000;
const samplePrompts = examplePrompts.map((prompt) => prompt.prompt);

// Rotate through prompts every 4 seconds
function usePrompts() {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromptIndex((prev) => (prev + 1) % samplePrompts.length);
    }, PROMPT_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return { currentPromptIndex };
}

interface DreamshaperProps {
  outputPlaybackId: string | null;
  streamUrl: string | null;
  handleUpdate: (prompt: string, options?: UpdateOptions) => void;
  loading: boolean;
  streamKilled?: boolean;
  fullResponse?: any;
  updating: boolean;
  live: boolean;
  statusMessage: string;
}

export default function Dreamshaper({
  outputPlaybackId,
  streamUrl,
  handleUpdate,
  loading,
  streamKilled = false,
  fullResponse,
  updating,
  live,
  statusMessage,
}: DreamshaperProps) {
  const isMac =
    typeof navigator !== "undefined"
      ? (navigator.userAgent?.includes("Mac") ?? false)
      : false;
  const { currentPromptIndex } = usePrompts();
  const [inputValue, setInputValue] = useState("");
  const isMobile = useIsMobile();
  const outputPlayerRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const { authenticated, login } = usePrivy();
  const { timeRemaining, formattedTime } = useTrialTimer();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const keyboardOffset = useKeyboardOffset(8);

  const isFullscreenAPISupported =
    typeof document !== "undefined" &&
    (document.fullscreenEnabled || (document as any).webkitFullscreenEnabled);

  useEffect(() => {
    setIsCollapsed(isMobile);
  }, [isMobile]);

  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  const submitPrompt = () => {
    if (inputValue) {
      handleUpdate(inputValue, { silent: true });
      setInputValue("");
    } else {
      console.error("No input value to submit");
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreenAPISupported) {
      if (!isFullscreen) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          (document.documentElement as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
      }
    }
    setIsFullscreen((prev) => !prev);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const bottomStyle = isFullscreen
    ? { bottom: isMobile ? `${keyboardOffset}px` : "20px" }
    : undefined;

  return (
    <div className="relative flex flex-col min-h-screen overflow-y-auto">
      {/* Header section */}
      <div className={cn(
        "flex justify-center items-center p-3 mt-8",
        isFullscreen && "hidden"
      )}>
        <div className="mx-auto text-center">
          <h1 className="text-xl md:text-2xl font-bold">Livepeer Pipelines</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Transform your video in real-time with AI - and build your own
            workflow with ComfyUI
          </p>
        </div>
      </div>

      {/* Main content area */}
      <div className={cn(
        "px-4 my-8 flex items-center justify-center",
        isFullscreen && "fixed inset-0 z-[9999] p-0 m-0"
      )}>
        <div
          ref={outputPlayerRef}
          className={cn(
            "w-full max-w-[calc(min(100%,calc((100vh-24rem)*16/9)))] md:aspect-video aspect-square bg-sidebar rounded-2xl overflow-hidden relative",
            isFullscreen && "w-full h-full max-w-none rounded-none"
          )}
        >
          {/* Hide controls for mobile (TODO: when it's a react component,
          we can use the component's own controls - now it's an iframe) */}
          {isFullscreen && isMobile && (
            <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-black z-40" />
          )}

          {/* Go full screen */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>

          {/* Live indicator*/}
          {live && (
            <div className="absolute top-4 left-4 bg-neutral-800 text-gray-400 px-5 py-1 text-xs rounded-full border border-gray-500">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              <span className="text-white font-bold">Live</span>
            </div>
          )}

          {/* Timer overlay */}
          {!authenticated && timeRemaining !== null && (
            <div className="absolute top-4 right-4 bg-neutral-800/30 text-gray-400 px-5 py-1 text-xs rounded-full border border-gray-500">
              <span className="text-[10px] mr-2">left</span> {formattedTime}
            </div>
          )}

          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : streamKilled ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Thank you for trying out Livepeer's AI pipelines.
            </div>
          ) : outputPlaybackId ? (
            <>
              <div className="relative w-full h-full">
                <LPPLayer
                  output_playback_id={outputPlaybackId}
                  isMobile={isMobile}
                />
                {/* Overlay */}
                <div className="absolute inset-x-0 top-0 h-[85%] bg-transparent" />
              </div>
              {!isMobile && streamUrl && (
                <div className={cn(
                  "absolute bottom-16 right-4 z-50 transition-all duration-300",
                  isCollapsed ? "w-12 h-12" : "w-80 h-[180px]"
                )}>
                  <BroadcastWithControls 
                    ingestUrl={streamUrl} 
                    isCollapsed={isCollapsed}
                    onCollapse={setIsCollapsed}
                    className="rounded-xl overflow-hidden"
                  />
                </div>
              )}
              {!live && (
                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center rounded-2xl">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                  {statusMessage && (
                    <span className="mt-4 text-white text-sm">
                      {statusMessage}
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Waiting for stream to start...
            </div>
          )}
        </div>
      </div>

      {/* Mobile broadcast controls */}
      {isMobile && streamUrl && (
        <div className="mx-4 w-auto -mt-2 mb-4">
          {loading ? (
            <div className="w-8 h-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className={cn(
              "flex-shrink-0 transition-all duration-300",
              isCollapsed 
                ? "h-8" 
                : "h-48"
            )}>
              <BroadcastWithControls
                ingestUrl={streamUrl}
                isCollapsed={isCollapsed}
                onCollapse={setIsCollapsed}
                className="rounded-xl overflow-hidden w-full"
              />
            </div>
          )}
        </div>
      )}

      <div
        style={bottomStyle}
        className={cn(
          "mx-auto flex justify-center items-center gap-2 h-14 md:h-full md:gap-4 mt-8 mb-4 dark:bg-[#1A1A1A] rounded-[100px] md:rounded-xl py-3.5 px-3 md:py-1.5 md:px-3 w-[calc(100%-2rem)] md:w-[calc(min(100%,965px))] border-2 border-muted-foreground/10 relative",
          isFullscreen
            ? "fixed left-1/2 -translate-x-1/2 z-[10000] mb-0 mt-0 w-[600px] max-w-[calc(100%-2rem)] max-h-16"
            : "z-[30]"
        )}
      >
        <div className="relative flex items-center flex-1">
          <AnimatePresence mode="wait">
            {!inputValue && (
              <motion.span
                key={currentPromptIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.25, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "absolute inset-y-0 left-3 md:left-1 flex items-center text-muted-foreground pointer-events-none text-xs"
                )}
              >
                {samplePrompts[currentPromptIndex]}
              </motion.span>
            )}
          </AnimatePresence>
          {isMobile ? (
            <Input
              className="w-full shadow-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm outline-none bg-transparent h-14"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitPrompt();
                }
              }}
            />
          ) : (
            <TextareaAutosize
              minRows={1}
              maxRows={5}
              className="w-full shadow-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm outline-none bg-transparent h-14"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (e.metaKey || e.ctrlKey) {
                    // new line when Cmd/Ctrl + Enter is pressed
                    setInputValue(prev => prev + "\n");
                  } else {
                    e.preventDefault();
                    submitPrompt();
                  }
                }
              }}
              style={{ resize: "none" }}
            />
          )}
        </div>
        {inputValue && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={(e) => {
              e.preventDefault();
              setInputValue("");
            }}
          >
            <span className="text-muted-foreground text-lg">×</span>
          </Button>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={(e) => {
                e.preventDefault();
                submitPrompt();
              }}
              className={cn(
                "border-none rounded-[100px] md:rounded-xl w-36 items-center justify-center font-semibold text-xs",
                updating && "bg-muted text-muted-foreground",
                isMobile && "text-xs w-24"
              )}
            >
              {updating ? (
                <span>
                  Applying
                  <div className="inline-flex ml-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.6,
                          delay: i * 0.2,
                          repeatDelay: 0.6,
                        }}
                      >
                        .
                      </motion.span>
                    ))}
                  </div>
                </span>
              ) : isMobile ? (
                "Apply"
              ) : (
                "Apply changes"
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Press Enter</TooltipContent>
        </Tooltip>
      </div>

      <div className={cn(
        "mx-auto flex items-center justify-center gap-4 text-xs capitalize text-muted-foreground mt-4 mb-8",
        isFullscreen && "hidden"
      )}>
        <Link
          target="_blank"
          href="https://pipelines.livepeer.org/docs/knowledge-base/get-started/what-is-pipeline"
          className=" hover:text-muted-foreground/80"
        >
          Build a pipeline
        </Link>
        <Separator orientation="vertical" />
        <Link
          target="_blank"
          href="https://discord.gg/livepeer"
          className=" hover:text-muted-foreground/80"
        >
          Join our community
        </Link>
      </div>
    </div>
  );
}
