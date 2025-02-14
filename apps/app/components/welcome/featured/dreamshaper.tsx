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
import { useProfanity } from "./useProfanity";

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
  const profanity = useProfanity(inputValue);
  const isMobile = useIsMobile();
  const outputPlayerRef = useRef<HTMLDivElement>(null);
  const [dragConstraints, setDragConstraints] = useState({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  });

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const { authenticated, login } = usePrivy();
  const { timeRemaining, formattedTime } = useTrialTimer();

  useEffect(() => {
    const calculateConstraints = () => {
      if (outputPlayerRef.current) {
        const playerRect = outputPlayerRef.current.getBoundingClientRect();
        const broadcastWidth = 320;
        const broadcastHeight = 180;
        const margin = 32;

        setDragConstraints({
          top: -playerRect.height + broadcastHeight + margin,
          left: -playerRect.width + broadcastWidth + margin,
          right: 0,
          bottom: 0,
        });
      }
    };

    calculateConstraints();
    window.addEventListener("resize", calculateConstraints);
    return () => window.removeEventListener("resize", calculateConstraints);
  }, [outputPlaybackId]);

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const onDragEnd = (event: any, info: any) => {
    const currentX = x.get();
    const currentY = y.get();

    const clampedX = clamp(
      currentX,
      dragConstraints.left,
      dragConstraints.right
    );
    const clampedY = clamp(
      currentY,
      dragConstraints.top,
      dragConstraints.bottom
    );

    const distanceToRight = Math.abs(dragConstraints.right - clampedX);
    const distanceToLeft = Math.abs(dragConstraints.left - clampedX);
    const distanceToBottom = Math.abs(dragConstraints.bottom - clampedY);
    const distanceToTop = Math.abs(dragConstraints.top - clampedY);

    if (
      Math.min(distanceToRight, distanceToLeft) <
      Math.min(distanceToBottom, distanceToTop)
    ) {
      const targetX =
        distanceToRight <= distanceToLeft
          ? dragConstraints.right
          : dragConstraints.left;
      animate(x, targetX, { type: "spring", damping: 20, stiffness: 300 });
      animate(y, clampedY, { type: "spring", damping: 20, stiffness: 300 });
    } else {
      const targetY =
        distanceToBottom <= distanceToTop
          ? dragConstraints.bottom
          : dragConstraints.top;
      animate(x, clampedX, { type: "spring", damping: 20, stiffness: 300 });
      animate(y, targetY, { type: "spring", damping: 20, stiffness: 300 });
    }
  };

  const submitPrompt = () => {
    if (inputValue) {
      handleUpdate(inputValue, { silent: true });
    } else {
      console.error("No input value to submit");
    }
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-2rem)]">
      {/* Header section */}
      <div className="flex justify-center items-center p-3 mt-8">
        <div className="mx-auto text-center">
          <h1 className="text-2xl font-bold">Livepeer Pipelines</h1>
          <p className="text-muted-foreground">
            Transform your video in real-time with AI - and build your own
            workflow with ComfyUI
          </p>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 min-h-0 p-4 flex items-center justify-center">
        <div
          ref={outputPlayerRef}
          className="w-full max-w-[calc(min(100%,calc((100vh-20rem)*16/9)))] aspect-video bg-sidebar rounded-2xl overflow-hidden relative"
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
              <LPPLayer output_playback_id={outputPlaybackId} />
              {!isMobile && streamUrl && (
                <motion.div
                  drag
                  dragConstraints={dragConstraints}
                  dragElastic={0}
                  dragMomentum={false}
                  dragTransition={{
                    bounceStiffness: 600,
                    bounceDamping: 20,
                  }}
                  onDragEnd={onDragEnd}
                  style={{ x, y }}
                  className="absolute bottom-4 right-4 w-80 h-[180px] shadow-lg z-50 rounded-xl overflow-hidden border border-white/10 cursor-move"
                >
                  <BroadcastWithControls ingestUrl={streamUrl} />
                </motion.div>
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

      {isMobile && (
        <div className="flex-shrink-0 h-64 p-4">
          {loading || !streamUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <BroadcastWithControls
              ingestUrl={streamUrl}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}

      {/* Updated Input Prompt + Button Section */}
      <div
        className={cn(
          "mx-auto flex justify-center items-center gap-2 my-4 h-12 dark:bg-[#1A1A1A] rounded-full py-2.5 px-4 w-[calc(min(100%,965px))] border-2 border-muted-foreground/10",
          profanity && "dark:border-red-700 border-red-600"
        )}
      >
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
            className="w-full shadow-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (
                !updating &&
                !profanity &&
                e.key === "Enter" &&
                (e.metaKey || e.ctrlKey)
              ) {
                submitPrompt();
              }
            }}
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={profanity || updating || !inputValue}
              onClick={submitPrompt}
              className={cn(
                "border-none rounded-full w-36 items-center justify-center font-semibold text-xs",
                updating &&
                  "bg-muted text-muted-foreground disabled:opacity-100",
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
