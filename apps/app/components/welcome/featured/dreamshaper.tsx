import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { examplePrompts } from "./interstitial";
import { TooltipTrigger } from "@repo/design-system/components/ui/tooltip";
import { TooltipContent } from "@repo/design-system/components/ui/tooltip";
import { Tooltip } from "@repo/design-system/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useDreamshaper } from "./useDreamshaper";
import { BroadcastWithControls } from "@/components/playground/broadcast";
import { Loader2 } from "lucide-react";
import { LPPLayer } from "@/components/playground/player";
import Link from "next/link";
import { useIsMobile } from "@repo/design-system/hooks/use-mobile";
import { usePrivy } from "@privy-io/react-auth";
import { useTrialTimer } from "@/hooks/useTrialTimer";

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
  handleUpdate: (prompt: string) => void;
  loading: boolean;
  streamKilled?: boolean;
}

export default function Dreamshaper({
  outputPlaybackId,
  streamUrl,
  handleUpdate,
  loading,
  streamKilled = false,
}: DreamshaperProps) {
  const isMac =
    typeof navigator !== "undefined"
      ? (navigator.userAgent?.includes("Mac") ?? false)
      : false;
  const { currentPromptIndex } = usePrompts();
  const [inputValue, setInputValue] = useState("");
  const isMobile = useIsMobile();

  const { authenticated, login } = usePrivy();
  const { timeRemaining, formattedTime } = useTrialTimer();

  const submitPrompt = () => {
    if (inputValue) {
      handleUpdate(inputValue);
    }
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-10rem)] overflow-hidden">
      {/* Header section */}
      <div className="flex justify-between items-start p-3">
        <div>
          <h1 className="text-2xl font-bold">Livepeer Pipelines</h1>
          <p className="text-muted-foreground">
            Transform your video in real-time with AI - and build your own workflow with ComfyUI
          </p>
        </div>
        {!authenticated && timeRemaining !== null && (
          <div className="text-right">
            <div className="text-sm font-medium">
              Time remaining: {formattedTime}
            </div>
            <button
              onClick={login}
              className="text-xs text-muted-foreground cursor-pointer bg-transparent border-0"
            >
              Sign in to continue streaming
            </button>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 min-h-0 p-4 flex items-center justify-center">
        <div className="w-full max-w-[calc(min(100%,calc((100vh-20rem)*16/9)))] aspect-video bg-sidebar rounded-2xl overflow-hidden relative">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : streamKilled ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Thank you for trying out Livepeer's AI pipelines. Please sign in to continue streaming.
            </div>
          ) : outputPlaybackId ? (
            <LPPLayer output_playback_id={outputPlaybackId} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Waiting for stream to start...
            </div>
          )}
        </div>
      </div>

      {/* Broadcast component */}
      {isMobile ? (
        <div className="flex-shrink-0 h-64 p-4">
          {loading || !streamUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <BroadcastWithControls ingestUrl={streamUrl} />
          )}
        </div>
      ) : (
        <div className="absolute bottom-4 right-4 w-64 h-32 shadow-lg">
          {loading || !streamUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-background rounded-md">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <BroadcastWithControls ingestUrl={streamUrl} />
          )}
        </div>
      )}

      {/* Prompt input section - moved to bottom */}
      <div className="flex-shrink-0 flex items-center gap-4 px-4 h-[42px] mb-4">
        <div className="relative flex-1">
          <AnimatePresence mode="wait">
            {!inputValue && (
              <motion.span
                key={currentPromptIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.5, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="absolute left-3 inset-y-0 flex items-center text-muted-foreground pointer-events-none"
              >
                {samplePrompts[currentPromptIndex]}
              </motion.span>
            )}
          </AnimatePresence>
          <Input
            className="w-full h-[42px]"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                submitPrompt();
              }
            }}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={submitPrompt} className="absolute right-0 inset-y-0 my-auto">
                Apply {isMobile ? "" : isMac ? "(⌘ + Enter)" : "(Ctrl + Enter)"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isMac ? "⌘ + Enter" : "Ctrl + Enter"}</TooltipContent>
          </Tooltip>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="https://pipelines.livepeer.org/docs/knowledge-base/get-started/what-is-pipeline"
              target="_blank"
              className="hidden md:block"
            >
              <Button variant="outline">Build your own pipeline</Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>Build your own pipeline</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
