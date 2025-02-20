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
import { useProfanity } from "./useProfanity";
import { toast } from "sonner";
import track from "@/lib/track";
import Image from "next/image";
import { SidebarTrigger } from "@repo/design-system/components/ui/sidebar";
import { Inter } from "next/font/google";

const PROMPT_INTERVAL = 4000;
const samplePrompts = examplePrompts.map((prompt) => prompt.prompt);

const MAX_STREAM_TIMEOUT_MS = 90000; // 90 seconds

// Rotate through prompts every 4 seconds
function usePrompts() {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (lastSubmittedPrompt) return;

    const interval = setInterval(() => {
      setCurrentPromptIndex((prev) => (prev + 1) % samplePrompts.length);
    }, PROMPT_INTERVAL);

    return () => clearInterval(interval);
  }, [lastSubmittedPrompt]);

  return { currentPromptIndex, lastSubmittedPrompt, setLastSubmittedPrompt };
}

const inter = Inter({ subsets: ["latin"] });

interface DreamshaperProps {
  outputPlaybackId: string | null;
  streamKey: string | null;
  streamUrl: string | null;
  handleUpdate: (prompt: string, options?: UpdateOptions) => void;
  loading: boolean;
  streamKilled?: boolean;
  fullResponse?: any;
  updating: boolean;
  live: boolean;
  statusMessage: string;
  capacityReached: boolean;
}

export default function Dreamshaper({
  outputPlaybackId,
  streamKey,
  streamUrl,
  handleUpdate,
  loading,
  streamKilled = false,
  fullResponse,
  updating,
  live,
  statusMessage,
  capacityReached,
}: DreamshaperProps) {
  const { currentPromptIndex, lastSubmittedPrompt, setLastSubmittedPrompt } =
    usePrompts();
  const [inputValue, setInputValue] = useState("");
  const profanity = useProfanity(inputValue);
  const isMobile = useIsMobile();
  const outputPlayerRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const { authenticated, login } = usePrivy();
  const { timeRemaining, formattedTime } = useTrialTimer();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

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

  useEffect(() => {
    track("daydream_page_view", {
      is_authenticated: authenticated
    });
  }, []);

  useEffect(() => {
    if (live) {
      track("daydream_stream_started", {
        is_authenticated: authenticated,
        playback_id: outputPlaybackId
      });
    }
  }, [live]);

  const showCapacityToast = () => {
    track("capacity_reached");
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
    if (capacityReached || (timeoutReached && !live)) {
      const reason = capacityReached 
        ? "capacity_reached" 
        : "timeout_reached_not_live";
      
      console.log("Toast shown due to:", reason, {
        capacityReached,
        timeoutReached,
        live
      });

      track("daydream_capacity_reached", {
        is_authenticated: authenticated,
        reason
      });
      showCapacityToast();
    }
  }, [capacityReached, timeoutReached, live]);

  // Debug keyboard shortcut - Cmd/Ctrl + T
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "t") {
        console.log("Debug: Triggering capacity reached toast");
        showCapacityToast();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const submitPrompt = () => {
    if (inputValue) {
      if (isMobile && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      track("daydream_prompt_submitted", {
        is_authenticated: authenticated,
        prompt: inputValue
      });

      handleUpdate(inputValue, { silent: true });
      setLastSubmittedPrompt(inputValue); // Store the submitted prompt
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

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div className="relative flex flex-col min-h-screen overflow-y-auto">
      {/* Header section */}
      <div
        className={cn(
          "flex justify-center items-center p-3 mt-4",
          isFullscreen && "hidden"
        )}
      >
        {isMobile && (
          <div className="absolute flex items-center left-2 top-7">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        )}
        <div className="mx-auto text-center flex flex-col items-center gap-2">
          <h1
            className={cn(
              inter.className,
              "text-lg md:text-xl flex flex-col items-center uppercase font-light"
            )}
          >
            Daydream
            <div className="flex items-center gap-2 text-xs">
              <span className="uppercase text-xs">by</span>
              <span className="w-16">
                <Image
                  src="https://mintlify.s3.us-west-1.amazonaws.com/livepeer-ai/logo/dark.svg"
                  alt="Livepeer logo"
                  width={100}
                  height={100}
                />
              </span>
            </div>
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Transform your video in real-time with AI - and build your own
            workflow with ComfyUI
          </p>
        </div>
      </div>

      {/* Main content area */}
      <div
        className={cn(
          "px-4 my-2 flex items-center justify-center",
          isFullscreen && "fixed inset-0 z-[9999] p-0 m-0"
        )}
      >
        <div
          ref={outputPlayerRef}
          className={cn(
            "w-full max-w-[calc(min(100%,calc((100vh-14rem)*16/9)))] mx-auto md:aspect-video aspect-square bg-sidebar rounded-2xl overflow-hidden relative",
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
            className="absolute top-4 right-4 z-50 bg-transparent hover:bg-transparent focus:outline-none focus-visible:ring-0 active:bg-transparent"
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
            <div className="absolute top-5 right-16 bg-neutral-800/30 text-gray-400 px-5 py-1 text-xs rounded-full border border-gray-500 z-50">
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
                  stream_key={streamKey}
                  isMobile={isMobile}
                />
                {/* Overlay */}
                <div className="absolute inset-x-0 top-0 h-[85%] bg-transparent" />
              </div>
              {!isMobile && streamUrl && (
                <div
                  className={cn(
                    "absolute bottom-16 right-4 z-50 transition-all duration-300",
                    isCollapsed ? "w-12 h-12" : "w-[25%] aspect-video"
                  )}
                >
                  <BroadcastWithControls
                    ingestUrl={streamUrl}
                    isCollapsed={isCollapsed}
                    onCollapse={setIsCollapsed}
                    className="rounded-xl overflow-hidden"
                  />
                </div>
              )}
              {!live || showOverlay ? (
                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center rounded-2xl">
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

      {/* Mobile broadcast controls */}
      {isMobile && streamUrl && (
        <div className="mx-4 w-auto -mt-2 mb-4">
          {loading ? (
            <div className="w-8 h-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div
              className={cn(
                "flex-shrink-0 transition-all duration-300 [&>div]:!pb-0 [&>div]:h-full",
                isCollapsed ? "h-8" : "h-64"
              )}
            >
              <BroadcastWithControls
                ingestUrl={streamUrl}
                isCollapsed={isCollapsed}
                onCollapse={setIsCollapsed}
                className="rounded-xl overflow-hidden w-full h-full"
              />
            </div>
          )}
        </div>
      )}

      {/* Input prompt */}
      <div
        className={cn(
          "relative mx-auto flex justify-center items-center gap-2 h-12 md:h-12 md:gap-4 mt-4 mb-2 dark:bg-[#1A1A1A] rounded-[100px] md:rounded-xl py-2.5 px-3 md:py-1.5 md:px-3 w-[calc(100%-2rem)] md:w-[calc(min(100%,800px))] border-2 border-muted-foreground/10",
          isFullscreen
            ? isMobile
              ? "fixed left-1/2 bottom-[calc(env(safe-area-inset-bottom)+16px)] -translate-x-1/2 z-[10000] w-[600px] max-w-[calc(100%-2rem)] max-h-16"
              : "fixed left-1/2 bottom-0 -translate-x-1/2 z-[10000] w-[600px] max-w-[calc(100%-2rem)] max-h-16"
            : "z-[30]",
          profanity && "dark:border-red-700 border-red-600"
        )}
      >
        <div className="relative flex items-center flex-1">
          <AnimatePresence mode="wait">
            {!inputValue && (
              <motion.span
                key={lastSubmittedPrompt || currentPromptIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.25, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "absolute inset-y-0 left-3 md:left-1 flex items-center text-muted-foreground pointer-events-none text-xs"
                )}
              >
                {lastSubmittedPrompt || samplePrompts[currentPromptIndex]}
              </motion.span>
            )}
          </AnimatePresence>
          {isMobile ? (
            <Input
              className="w-full shadow-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm outline-none bg-transparent h-14"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => {
                window.scrollTo({
                  top: document.body.scrollHeight,
                  behavior: "smooth",
                });
              }}
              onKeyDown={(e) => {
                if (!updating && !profanity && e.key === "Enter") {
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
                if (
                  !updating &&
                  !profanity &&
                  e.key === "Enter" &&
                  !(e.metaKey || e.ctrlKey || e.shiftKey)
                ) {
                  e.preventDefault();
                  submitPrompt();
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
              disabled={updating || !inputValue || profanity}
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
              ) : (
                <span>Apply</span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Press Enter</TooltipContent>
        </Tooltip>

        {profanity && (
          <div
            className={cn(
              "absolute -top-10 left-0 mx-auto flex items-center justify-center gap-4 text-xs text-muted-foreground mt-4",
              isMobile && "-top-8 text-[9px] left-auto"
            )}
          >
            <span className="text-red-600">
              Please fix your prompt as it may contain harmful words
            </span>
          </div>
        )}
      </div>

      <div
        className={cn(
          "mx-auto flex items-center justify-center gap-4 text-xs capitalize text-muted-foreground mt-2 mb-4",
          isFullscreen && "hidden"
        )}
      >
        <Link
          target="_blank"
          href="https://www.livepeer.org/learn-about-pipelines"
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
