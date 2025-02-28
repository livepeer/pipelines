"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { examplePrompts } from "./interstitial";
import { TooltipTrigger } from "@repo/design-system/components/ui/tooltip";
import { TooltipContent } from "@repo/design-system/components/ui/tooltip";
import { Tooltip } from "@repo/design-system/components/ui/tooltip";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { BroadcastWithControls } from "@/components/playground/broadcast";
import { Loader2, Maximize, Minimize, Send, Copy, Share2 } from "lucide-react";
import { LPPLayer } from "@/components/playground/player";
import { useIsMobile } from "@repo/design-system/hooks/use-mobile";
import { usePrivy } from "@privy-io/react-auth";
import { useTrialTimer } from "@/hooks/useTrialTimer";
import { cn } from "@repo/design-system/lib/utils";
import { UpdateOptions } from "./useDreamshaper";
import Link from "next/link";
import { Separator } from "@repo/design-system/components/ui/separator";
import TextareaAutosize from "react-textarea-autosize";
import { MAX_PROMPT_LENGTH, useValidateInput } from "./useValidateInput";
import { toast } from "sonner";
import track from "@/lib/track";
import Image from "next/image";
import { SidebarTrigger } from "@repo/design-system/components/ui/sidebar";
import { Inter } from "next/font/google";
import { StreamDebugPanel } from "@/components/stream/stream-debug-panel";
import { StreamStatus } from "@/hooks/useStreamStatus";
import { TrackedButton } from "@/components/analytics/TrackedButton";
import { StreamInfo } from "@/components/footer/stream-info";
import { ShareModal } from "./ShareModal";

const PROMPT_INTERVAL = 4000;
const samplePrompts = examplePrompts.map(prompt => prompt.prompt);

const MAX_STREAM_TIMEOUT_MS = 90000; // 90 seconds

// Rotate through prompts every 4 seconds
function usePrompts() {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (lastSubmittedPrompt) return;

    const interval = setInterval(() => {
      setCurrentPromptIndex(prev => (prev + 1) % samplePrompts.length);
    }, PROMPT_INTERVAL);

    return () => clearInterval(interval);
  }, [lastSubmittedPrompt]);

  return { currentPromptIndex, lastSubmittedPrompt, setLastSubmittedPrompt };
}

const inter = Inter({ subsets: ["latin"] });

interface DreamshaperProps {
  outputPlaybackId: string | null;
  streamKey: string | null;
  streamId: string | null;
  streamUrl: string | null;
  handleUpdate: (prompt: string, options?: UpdateOptions) => void;
  loading: boolean;
  streamKilled?: boolean;
  fullResponse?: any;
  updating: boolean;
  live: boolean;
  statusMessage: string;
  capacityReached: boolean;
  status: StreamStatus | null;
  createShareLink?: () => Promise<{ error: string | null; url: string | null }>;
  sharedPrompt?: string | null;
}

export default function Dreamshaper({
  outputPlaybackId,
  streamKey,
  streamId,
  streamUrl,
  handleUpdate,
  loading,
  streamKilled = false,
  fullResponse,
  updating,
  live,
  statusMessage,
  capacityReached,
  status,
  createShareLink,
  sharedPrompt = null,
}: DreamshaperProps) {
  const { currentPromptIndex, lastSubmittedPrompt, setLastSubmittedPrompt } =
    usePrompts();
  const [inputValue, setInputValue] = useState("");
  const { profanity, exceedsMaxLength } = useValidateInput(inputValue);
  const isMobile = useIsMobile();
  const outputPlayerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const { authenticated, login, user } = usePrivy();
  const { timeRemaining, formattedTime } = useTrialTimer();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [debugOpen, setDebugOpen] = useState(false);
  const [hasSubmittedPrompt, setHasSubmittedPrompt] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [promptVersion, setPromptVersion] = useState(0);

  const isFullscreenAPISupported =
    typeof document !== "undefined" &&
    (document.fullscreenEnabled || (document as any).webkitFullscreenEnabled);

  const toastShownRef = useRef(false);

  const [isInputHovered, setIsInputHovered] = useState(false);

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
      is_authenticated: authenticated,
    });
  }, []);

  useEffect(() => {
    if (live) {
      track("daydream_stream_started", {
        is_authenticated: authenticated,
        playback_id: outputPlaybackId,
        stream_id: streamId,
      });
    }
  }, [live]);

  const showCapacityToast = () => {
    track("capacity_reached", {
      is_authenticated: authenticated,
      stream_id: streamId,
    });
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
    if (
      (capacityReached || (timeoutReached && !live)) &&
      !toastShownRef.current
    ) {
      const reason = capacityReached
        ? "capacity_reached"
        : "timeout_reached_not_live";

      console.error("Capacity reached, reason:", reason, {
        capacityReached,
        timeoutReached,
        live,
      });

      track("daydream_capacity_reached", {
        is_authenticated: authenticated,
        reason,
        stream_id: streamId,
      });
      showCapacityToast();
      toastShownRef.current = true;
    }
  }, [capacityReached, timeoutReached, live]);

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
    if (!isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobile]);

  const submitPrompt = () => {
    if (inputValue) {
      if (isMobile && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      track("daydream_prompt_submitted", {
        is_authenticated: authenticated,
        prompt: inputValue,
        stream_id: streamId,
      });

      handleUpdate(inputValue, { silent: true });
      setLastSubmittedPrompt(inputValue); // Store the submitted prompt
      setHasSubmittedPrompt(true); 
      setInputValue("");
      setPromptVersion(prev => prev + 1);
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
    setIsFullscreen(prev => !prev);
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

  useEffect(() => {
    if (sharedPrompt) {
      setLastSubmittedPrompt(sharedPrompt);
      setHasSubmittedPrompt(true);
    }
  }, [sharedPrompt, setLastSubmittedPrompt]);

  const restoreLastPrompt = () => {
    if (lastSubmittedPrompt) {
      setInputValue(lastSubmittedPrompt);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen overflow-y-auto">
      {/* Header section */}
      <div
        className={cn(
          "flex items-start mt-4 w-full max-w-[calc(min(100%,calc((100vh-16rem)*16/9)))] mx-auto relative",
          isFullscreen && "hidden",
          isMobile ? "justify-center px-3 py-3" : "justify-between py-3"
        )}
      >
        {isMobile && (
          <div className="absolute flex items-center left-2 top-7">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        )}
        <div className={cn(
          "flex flex-col gap-2",
          isMobile ? "text-center items-center" : "text-left items-start"
        )}>
          <h1
            className={cn(
              inter.className,
              "text-lg md:text-xl flex flex-col uppercase font-light",
              isMobile ? "items-center" : "items-start"
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
          <p className="text-xs md:text-sm text-muted-foreground max-w-[280px] md:max-w-none">
            Transform your video in real-time with AI - and build your own
            workflow with ComfyUI
          </p>
        </div>
        
        {/* Header buttons */}
        {!isMobile && !isFullscreen && (
          <div className="absolute bottom-3 right-0 flex gap-2">
            {createShareLink && hasSubmittedPrompt && (
              <TrackedButton
                trackingEvent="daydream_share_button_clicked"
                trackingProperties={{
                  is_authenticated: authenticated,
                }}
                variant="ghost"
                size="sm"
                className="bg-transparent hover:bg-black/10 border border-muted-foreground/30 text-foreground px-3 py-1 text-xs rounded-lg font-semibold h-[36px] flex items-center"
                onClick={() => setIsShareModalOpen(true)}
              >
                Share
              </TrackedButton>
            )}
            
            <Link
              target="_blank"
              href="https://discord.com/invite/hxyNHeSzCK"
              className="bg-transparent hover:bg-black/10 border border-muted-foreground/30 text-foreground px-3 py-1 text-xs rounded-lg font-semibold h-[36px] flex items-center"
            >
              Join Community
            </Link>
          </div>
        )}
      </div>

      {/* Mobile share button */}
      {isMobile && createShareLink && hasSubmittedPrompt && (
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            className="p-0 m-0 bg-transparent border-none hover:bg-transparent focus:outline-none"
            onClick={() => setIsShareModalOpen(true)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main content area */}
      <div
        className={cn(
          "px-4 my-4 flex items-center justify-center md:mb-0 md:my-2 mb-5",
          isFullscreen && "fixed inset-0 z-[9999] p-0 m-0",
        )}
      >
        <div
          ref={outputPlayerRef}
          className={cn(
            "w-full max-w-[calc(min(100%,calc((100vh-16rem)*16/9)))] mx-auto md:aspect-video aspect-square bg-sidebar rounded-2xl overflow-hidden relative",
            isFullscreen && "w-full h-full max-w-none rounded-none",
          )}
        >
          {/* Hide controls for mobile (TODO: when it's a react component,
          we can use the component's own controls - now it's an iframe) */}
          {isFullscreen && isMobile && (
            <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-black z-40" />
          )}

          {/* Go full screen */}
          <TrackedButton
            trackingEvent="daydream_fullscreen_button_clicked"
            trackingProperties={{
              is_authenticated: authenticated,
            }}
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
          </TrackedButton>

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
                    isCollapsed ? "w-12 h-12" : "w-[25%] aspect-video",
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
                isCollapsed ? "h-8" : "h-64",
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
          "relative mx-auto flex justify-center items-center gap-2 h-14 md:h-auto md:min-h-14 md:gap-2 mt-4 mb-2 dark:bg-[#1A1A1A] md:rounded-xl py-2.5 px-3 md:py-1.5 md:px-3 w-[calc(100%-2rem)] md:w-[calc(min(100%,800px))] border-2 border-muted-foreground/10",
          isFullscreen
            ? isMobile
              ? "fixed left-1/2 bottom-[calc(env(safe-area-inset-bottom)+16px)] -translate-x-1/2 z-[10000] w-[600px] max-w-[calc(100%-2rem)] max-h-16 rounded-2xl"
              : "fixed left-1/2 bottom-0 -translate-x-1/2 z-[10000] w-[600px] max-w-[calc(100%-2rem)] max-h-16 rounded-[100px]"
            : isMobile
              ? "rounded-2xl shadow-[4px_12px_16px_0px_#37373F40]"
              : "rounded-[100px]",
          (profanity || exceedsMaxLength) &&
            "dark:border-red-700 border-red-600",
        )}
      >
        <div 
          className="flex-1 relative flex items-center"
          onMouseEnter={() => setIsInputHovered(true)}
          onMouseLeave={() => setIsInputHovered(false)}
        >
          <AnimatePresence mode="wait">
            {!inputValue && (
              <motion.div
                key={lastSubmittedPrompt || `prompt-${currentPromptIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.5, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "absolute inset-y-0 left-3 md:left-1 flex items-center text-muted-foreground text-xs w-full",
                  isInputHovered ? "pointer-events-auto" : "pointer-events-none",
                )}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) {
                    return;
                  }
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              >
                <span>{lastSubmittedPrompt || samplePrompts[currentPromptIndex]}</span>
                {isInputHovered && lastSubmittedPrompt && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      restoreLastPrompt();
                    }}
                    className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Restore last prompt"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5"
                    >
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {isMobile ? (
            <Input
              className="w-full shadow-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm outline-none bg-transparent h-14 flex items-center"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onFocus={() => {
                window.scrollTo({
                  top: document.body.scrollHeight,
                  behavior: "smooth",
                });
              }}
              onKeyDown={e => {
                if (e.key === "ArrowUp" && lastSubmittedPrompt) {
                  e.preventDefault();
                  restoreLastPrompt();
                  return;
                }
                
                if (
                  !updating &&
                  !profanity &&
                  !exceedsMaxLength &&
                  e.key === "Enter"
                ) {
                  e.preventDefault();
                  submitPrompt();
                }
              }}
            />
          ) : (
            <TextareaAutosize
              ref={inputRef}
              minRows={1}
              maxRows={5}
              className="w-full shadow-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm outline-none bg-transparent h-14 break-all py-3.5"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "ArrowUp" && lastSubmittedPrompt) {
                  e.preventDefault();
                  restoreLastPrompt();
                  return;
                }
                
                if (
                  !updating &&
                  !profanity &&
                  !exceedsMaxLength &&
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
            onClick={e => {
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
              disabled={
                updating || !inputValue || profanity || exceedsMaxLength
              }
              onClick={e => {
                e.preventDefault();
                submitPrompt();
              }}
              className={cn(
                "border-none w-36 items-center justify-center font-semibold text-xs bg-[#00EB88] flex",
                updating && "bg-muted text-muted-foreground",
                isMobile ? "w-12 rounded-lg" : "w-12 rounded-lg",
              )}
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4 stroke-[3]" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Press Enter</TooltipContent>
        </Tooltip>

        {(profanity || exceedsMaxLength) && (
          <div
            className={cn(
              "absolute -top-10 left-0 mx-auto flex items-center justify-center gap-4 text-xs text-muted-foreground mt-4",
              isMobile && "-top-8 text-[9px] left-auto",
            )}
          >
            {exceedsMaxLength ? (
              <span className="text-red-600">
                {`Please fix your prompt as it exceeds the maximum length of ${MAX_PROMPT_LENGTH} characters`}
              </span>
            ) : (
              <span className="text-red-600">
                Please fix your prompt as it may contain harmful words
              </span>
            )}
          </div>
        )}
      </div>

      <div
        className={cn(
          "mx-auto flex items-center justify-center gap-4 text-xs capitalize text-muted-foreground mt-2 mb-4",
          isFullscreen && "hidden",
        )}
      >
        <Link
          target="_blank"
          href="https://www.livepeer.org/learn-about-pipelines"
          className="hover:text-muted-foreground/80"
        >
          Build a pipeline
        </Link>
        <Separator orientation="vertical" />
        {user?.email?.address?.endsWith("@livepeer.org") && (
          <>
            <Separator orientation="vertical" />
            <button
              onClick={() => setDebugOpen(!debugOpen)}
              className="hover:text-muted-foreground/80"
            >
              Debug Panel
            </button>
          </>
        )}
      </div>

      {user?.email?.address?.endsWith("@livepeer.org") && (
        <>
          {debugOpen && (
            <StreamDebugPanel
              streamId={streamId}
              streamKey={streamKey}
              status={status}
              fullResponse={fullResponse}
              onClose={() => setDebugOpen(false)}
            />
          )}
        </>
      )}

      {streamId && (
        <StreamInfo 
          streamId={streamId}
          streamKey={streamKey}
          isFullscreen={isFullscreen}
        />
      )}

      {createShareLink && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          createShareLink={createShareLink}
          streamId={streamId}
          isAuthenticated={authenticated}
          promptVersion={promptVersion}
        />
      )}
    </div>
  );
}
