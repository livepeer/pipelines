"use client";

import { TrackedButton } from "@/components/analytics/TrackedButton";
import { ClipButton } from "@/components/ClipButton";
import { StreamInfo } from "@/components/footer/stream-info";
import { StreamDebugPanel } from "@/components/stream/stream-debug-panel";
import { useCommandSuggestions } from "@/hooks/useCommandSuggestions";
import { StreamStatus } from "@/hooks/useStreamStatus";
import { useTrialTimer } from "@/hooks/useTrialTimer";
import track from "@/lib/track";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Separator } from "@repo/design-system/components/ui/separator";
import { SidebarTrigger } from "@repo/design-system/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { useIsMobile } from "@repo/design-system/hooks/use-mobile";
import { cn } from "@repo/design-system/lib/utils";
import {
  Loader2,
  Maximize,
  Minimize,
  WandSparkles,
  Share,
  Share2,
  SlidersHorizontal,
  Users2,
} from "lucide-react";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { ManagedBroadcast } from "./ManagedBroadcast";
import { LivepeerPlayer } from "./player";
import SettingsMenu from "./prompt-settings";
import { ShareModal } from "./ShareModal";
import { UpdateOptions } from "./useDreamshaper";
import { MAX_PROMPT_LENGTH, useValidateInput } from "./useValidateInput";

const PROMPT_PLACEHOLDER = "Describe the style to transform your stream...";
const MAX_STREAM_TIMEOUT_MS = 300000; // 5 minutes

// Rotate through prompts every 4 seconds
const usePrompts = () => {
  const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState<string | null>(
    null,
  );

  return { lastSubmittedPrompt, setLastSubmittedPrompt };
};

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
  pipeline: any | null;
}

// Define type for command options
type CommandOption = {
  id: string;
  label: string;
  type: string;
  description: string;
};

// Define type for pipeline parameters
type PipelineParam = {
  name: string;
  description?: string;
  widget?: string;
  // Add other fields if needed
};

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
  pipeline,
}: DreamshaperProps) {
  const { lastSubmittedPrompt, setLastSubmittedPrompt } = usePrompts();
  const [inputValue, setInputValue] = useState("");
  const { profanity, exceedsMaxLength } = useValidateInput(inputValue);
  const isMobile = useIsMobile();
  const outputPlayerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const { authenticated, user } = usePrivy();
  const { timeRemaining, formattedTime } = useTrialTimer();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [debugOpen, setDebugOpen] = useState(false);
  const [hasSubmittedPrompt, setHasSubmittedPrompt] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [promptVersion, setPromptVersion] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isFullscreenAPISupported =
    typeof document !== "undefined" &&
    (document.fullscreenEnabled || (document as any).webkitFullscreenEnabled);

  const toastShownRef = useRef(false);

  const [isInputHovered, setIsInputHovered] = useState(false);
  const commandOptions = useMemo<CommandOption[]>(() => {
    if (!pipeline?.prioritized_params) return [];

    return pipeline.prioritized_params.map((param: PipelineParam) => ({
      id: param.name.toLowerCase().replace(/\s+/g, "-"),
      label: param.name,
      type: param.widget || "string",
      description: param.description || param.name,
    }));
  }, [pipeline?.prioritized_params]);

  const {
    commandMenuOpen,
    filteredOptions,
    handleSelectOption,
    handleKeyDown: handleCommandKeyDown,
    caretRef,
    referenceElement,
    setReferenceElement,
    selectedOptionIndex,
  } = useCommandSuggestions({
    options: commandOptions,
    inputValue,
    setInputValue,
    inputRef,
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (commandMenuOpen) {
      handleCommandKeyDown(e);
      return;
    }

    if (e.key === "ArrowUp" && !inputValue && lastSubmittedPrompt) {
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
  };

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
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();

          if ("setSelectionRange" in inputRef.current) {
            const length = lastSubmittedPrompt.length;
            inputRef.current.setSelectionRange(length, length);
          }
        }
      }, 0);
    }
  };

  const formatInputWithHighlights = () => {
    if (!inputValue) return null;

    const commandRegex = /--([a-zA-Z0-9_-]+)(?:\s+(?:"([^"]*)"|([\S]*)))/g;

    const parts = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = commandRegex.exec(inputValue)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          text: inputValue.substring(lastIndex, match.index),
          isCommand: false,
          isValue: false,
        });
      }

      const commandName = `--${match![1]}`;
      const isValidCommand = commandOptions.some(
        option => option.id === match![1],
      );

      parts.push({
        text: commandName,
        isCommand: true,
        isValid: isValidCommand,
        isValue: false,
      });

      parts.push({
        text: " ",
        isCommand: false,
        isValue: false,
      });

      const value =
        match![2] !== undefined ? `"${match![2]}"` : match![3] || "";
      parts.push({
        text: value,
        isCommand: false,
        isValue: true,
        isValidCommand: isValidCommand,
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < inputValue.length) {
      parts.push({
        text: inputValue.substring(lastIndex),
        isCommand: false,
        isValue: false,
      });
    }

    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <pre className="text-sm font-sans whitespace-pre-wrap overflow-hidden w-full m-0 p-0 pl-3">
          {parts.map((part, i) => (
            <span
              key={i}
              className={
                part.isCommand && part.isValid
                  ? "text-green-500 font-medium"
                  : part.isValue && part.isValidCommand
                    ? "text-foreground font-bold"
                    : ""
              }
            >
              {part.text}
            </span>
          ))}
        </pre>
      </div>
    );
  };

  useEffect(() => {
    if (pipeline?.prioritized_params) {
      console.log("Pipeline prioritized params:", pipeline.prioritized_params);
    } else {
      console.log("No pipeline prioritized params");
    }
  }, [pipeline]);

  return (
    <div className="relative flex flex-col min-h-screen overflow-y-auto">
      {/* Header section */}
      <div
        className={cn(
          "flex items-start mt-4 w-full max-w-[calc(min(100%,calc((100vh-16rem)*16/9)))] mx-auto relative",
          isFullscreen && "hidden",
          isMobile ? "justify-center px-3 py-3" : "justify-between py-3",
        )}
      >
        {isMobile && (
          <div className="absolute flex items-center left-2 top-7">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        )}
        <div
          className={cn(
            "flex flex-col gap-2",
            isMobile ? "text-center items-center" : "text-left items-start",
          )}
        >
          <h1
            className={cn(
              inter.className,
              "text-lg md:text-xl flex flex-col uppercase font-light",
              isMobile ? "items-center" : "items-start",
            )}
          >
            Daydream
            <div className="flex items-center gap-2 text-xs">
              <span className="uppercase text-xs">by</span>
              <span className="w-16">
                <Image
                  src="https://mintlify.s3.us-west-1.amazonaws.com/livepeer-ai/logo/light.svg"
                  alt="Livepeer logo"
                  width={100}
                  height={100}
                />
              </span>
            </div>
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground max-w-[280px] md:max-w-none">
            Transform your video in real-time with AI
          </p>
        </div>

        {/* Header buttons */}
        {!isMobile && !isFullscreen && (
          <div className="absolute bottom-3 right-0 flex gap-2">
            <div className="flex items-center gap-2">
              {/* Only show clip button when stream is live */}
              {live && outputPlaybackId && streamUrl && (
                <ClipButton
                  disabled={!outputPlaybackId || !streamUrl}
                  className="mr-2"
                  trackAnalytics={track}
                  isAuthenticated={authenticated}
                />
              )}

              {createShareLink && (
                <TrackedButton
                  trackingEvent="daydream_share_button_clicked"
                  trackingProperties={{
                    is_authenticated: authenticated,
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => setIsShareModalOpen(true)}
                >
                  <Share className="h-4 w-4" />
                  <span>Share</span>
                </TrackedButton>
              )}
            </div>

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

      {isMobile && (
        <div className="z-50 flex gap-2 justify-end px-4 mt-2">
          {/* Mobile clip button - only show when live */}
          {live && outputPlaybackId && streamUrl && (
            <ClipButton
              disabled={!outputPlaybackId || !streamUrl}
              trackAnalytics={track}
              isAuthenticated={authenticated}
              isMobile={true}
            />
          )}

          {/* Mobile share button */}
          {createShareLink && hasSubmittedPrompt && (
            <Button
              variant="ghost"
              size="icon"
              className="p-0 m-0 bg-transparent border-none hover:bg-transparent focus:outline-none"
              onClick={() => setIsShareModalOpen(true)}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}

          <Link target="_blank" href="https://discord.com/invite/hxyNHeSzCK">
            <Button
              variant="ghost"
              size="icon"
              className="p-0 m-0 bg-transparent border-none hover:bg-transparent focus:outline-none"
            >
              <Users2 className="h-4 w-4" />
            </Button>
          </Link>
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
            <TooltipContent side="top" sideOffset={5} className="bg-white text-black border border-gray-200 shadow-md dark:bg-zinc-900 dark:text-white dark:border-zinc-700">
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
                <LivepeerPlayer
                  playbackId={outputPlaybackId}
                  isMobile={isMobile}
                  stream_key={streamKey}
                  streamId={streamId as string}
                  pipelineId={pipeline.id}
                  pipelineType={pipeline.type}
                  isFullscreen={isFullscreen}
                />
              </div>
              {!live || showOverlay ? (
                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center rounded-2xl z-[6]">
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

      <ManagedBroadcast
        streamUrl={streamUrl}
        isFullscreen={isFullscreen}
        outputPlayerRef={outputPlayerRef}
        loading={loading}
        streamId={(streamId as string) || ""}
        pipelineId={pipeline?.id || ""}
        pipelineType={pipeline?.type || ""}
      />

      {/* Input prompt */}
      <div
        className={cn(
          "relative mx-auto flex justify-center items-center gap-2 h-14 md:h-auto md:min-h-14 md:gap-2 mt-4 mb-2 dark:bg-[#1A1A1A] bg-white md:rounded-xl py-2.5 px-3 md:py-1.5 md:px-3 w-[calc(100%-2rem)] md:w-[calc(min(100%,800px))] border-2 border-muted-foreground/10",
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
          {!inputValue && (
            <div
              key={lastSubmittedPrompt}
              className={cn(
                "absolute inset-y-0 left-3 md:left-3 flex items-center text-muted-foreground/50 text-xs w-full z-10",
                isInputHovered ? "pointer-events-auto" : "pointer-events-none",
              )}
              onClick={e => {
                if ((e.target as HTMLElement).closest("button")) {
                  return;
                }
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
            >
              <span>{lastSubmittedPrompt || PROMPT_PLACEHOLDER}</span>
              {isInputHovered && lastSubmittedPrompt && (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        restoreLastPrompt();
                      }}
                      className="ml-2 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center relative z-20"
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
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={5} className="bg-white text-black border border-gray-200 shadow-md dark:bg-zinc-900 dark:text-white dark:border-zinc-700">
                    Edit prompt
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}

          {/* Input wrapper with highlighting */}
          <div
            className="relative w-full flex items-center"
            style={{ height: "auto" }}
          >
            {formatInputWithHighlights()}
            {isMobile ? (
              <Input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                className="w-full shadow-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm outline-none bg-transparent py-3 font-sans"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onFocus={() => {
                  window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: "smooth",
                  });
                }}
                onKeyDown={handleKeyDown}
                style={{
                  color: "transparent",
                  caretColor: "black",
                  paddingLeft: "12px",
                }}
              />
            ) : (
              <TextareaAutosize
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                minRows={1}
                maxRows={5}
                className="text-black w-full shadow-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm outline-none bg-transparent py-3 break-all font-sans pl-3"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  resize: "none",
                  color: "transparent",
                  caretColor: "black",
                }}
              />
            )}
          </div>

          {/* Command menu popover - Positioned ABOVE the input */}
          {commandMenuOpen && filteredOptions.length > 0 && (
            <div
              className="absolute z-50 bottom-full mb-2 w-60 bg-popover rounded-md border shadow-md"
              style={{
                left: caretRef.current?.left ?? 0,
              }}
            >
              <div className="p-1">
                {filteredOptions.map((option, index) => (
                  <button
                    key={option.id}
                    className={`flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm ${
                      index === selectedOptionIndex
                        ? "bg-accent"
                        : "hover:bg-accent"
                    } focus:outline-none`}
                    onClick={() => handleSelectOption(option)}
                  >
                    <div className="flex flex-col">
                      <div className="font-medium flex items-center">
                        <span>--{option.id}</span>
                        {option.type && (
                          <span className="ml-1.5 text-muted-foreground opacity-70 text-xs">
                            {option.type}
                          </span>
                        )}
                      </div>
                      {option.description && (
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
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

        {/* Settings button */}
        {!isMobile && (
          <div className="relative">
            <Tooltip delayDuration={50}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hidden md:flex"
                  onClick={e => {
                    e.preventDefault();
                    setSettingsOpen(!settingsOpen);
                  }}
                >
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-white text-black border border-gray-200 shadow-md dark:bg-zinc-900 dark:text-white dark:border-zinc-700">
                Adjustments
              </TooltipContent>
            </Tooltip>

            {settingsOpen && (
              <SettingsMenu
                pipeline={pipeline}
                inputValue={inputValue}
                setInputValue={setInputValue}
                onClose={() => setSettingsOpen(false)}
              />
            )}
          </div>
        )}

        {!isMobile && <Separator orientation="vertical" className="h-6 mr-2" />}

        <Tooltip delayDuration={50}>
          <TooltipTrigger asChild>
            <div className="relative inline-block">
              <Button
                disabled={
                  updating || !inputValue || profanity || exceedsMaxLength
                }
                onClick={e => {
                  e.preventDefault();
                  submitPrompt();
                }}
                className={cn(
                  "border-none items-center justify-center font-semibold text-xs bg-[#000000] flex disabled:bg-[#000000] disabled:opacity-80",
                  isMobile ? "w-auto h-9 aspect-square rounded-md" : "w-auto h-9 aspect-square rounded-md",
                )}
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <WandSparkles className="h-4 w-4 stroke-[2]" />
                )}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-white text-black border border-gray-200 shadow-md dark:bg-zinc-900 dark:text-white dark:border-zinc-700">
            Prompt <span className="text-gray-400 dark:text-gray-500">Enter</span>
          </TooltipContent>
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
        {user?.email?.address?.endsWith("@livepeer.org") && (
          <>
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
