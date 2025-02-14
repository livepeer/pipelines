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
import { Loader2 } from "lucide-react";
import { LPPLayer } from "@/components/playground/player";
import { useIsMobile } from "@repo/design-system/hooks/use-mobile";
import { usePrivy } from "@privy-io/react-auth";
import { useTrialTimer } from "@/hooks/useTrialTimer";
import { cn } from "@repo/design-system/lib/utils";
import { UpdateOptions } from "./useDreamshaper";
import Link from "next/link";
import { Separator } from "@repo/design-system/components/ui/separator";

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

  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  const submitPrompt = () => {
    if (inputValue) {
      handleUpdate(inputValue, { silent: true });
    } else {
      console.error("No input value to submit");
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen overflow-y-auto">
      {/* Header section */}
      <div className="flex justify-center items-center p-3 mt-8">
        <div className="mx-auto text-center">
          <h1 className="text-xl md:text-2xl font-bold">Livepeer Pipelines</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Transform your video in real-time with AI - and build your own
            workflow with ComfyUI
          </p>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 min-h-0 p-4 flex items-center justify-center mb-4">
        <div
          ref={outputPlayerRef}
          className="w-full max-w-[calc(min(100%,calc((100vh-20rem)*16/9)))] md:aspect-video aspect-square bg-sidebar rounded-2xl overflow-hidden relative"
        >
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
                <LPPLayer output_playback_id={outputPlaybackId} isMobile={isMobile} />
                {/* Overlay */}
                <div className="absolute inset-x-0 top-0 h-[85%] bg-transparent" />
              </div>
              {!isMobile && streamUrl && (
                <div className="absolute bottom-16 right-4 w-80 h-[180px] shadow-lg z-50 rounded-xl overflow-hidden">
                  <BroadcastWithControls ingestUrl={streamUrl} />
                </div>
              )}
              {!live && (
                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center rounded-2xl">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                  {statusMessage && (
                    <span className="mt-4 text-white text-sm">{statusMessage}</span>
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

      {isMobile && (
        <div className="flex-shrink-0 h-48 px-4 mb-4">
          {loading || !streamUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <BroadcastWithControls
              ingestUrl={streamUrl}
              className="w-full h-full rounded-2xl overflow-hidden"
            />
          )}
        </div>
      )}

      <div className="mx-auto flex justify-center items-center gap-2 md:gap-4 my-4 h-14 dark:bg-[#1A1A1A] rounded-[100px] md:rounded-xl py-3.5 px-3 md:px-6 w-[calc(min(100%,965px))] border-2 border-muted-foreground/10">
        <div className="relative flex-1">
          <AnimatePresence mode="wait">
            {!inputValue && (
              <motion.span
                key={currentPromptIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.5, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "absolute inset-y-0 left-3 flex items-center text-muted-foreground pointer-events-none text-xs"
                )}
              >
                {samplePrompts[currentPromptIndex]}
              </motion.span>
            )}
          </AnimatePresence>
          <Input
            className="w-full shadow-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm !rounded-[100px] md:!rounded-xl"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitPrompt();
              }
            }}
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={(e) => {
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
          <TooltipContent>
            Press Enter
          </TooltipContent>
        </Tooltip>
      </div>

      {
        <div className="mx-auto flex items-center justify-center gap-4 text-xs capitalize text-muted-foreground mt-4">
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
      }
    </div>
  );
}
