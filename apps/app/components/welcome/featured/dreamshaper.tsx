import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { examplePrompts } from "./interstitial";
import { TooltipTrigger } from "@repo/design-system/components/ui/tooltip";
import { TooltipContent } from "@repo/design-system/components/ui/tooltip";
import { Tooltip } from "@repo/design-system/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useDreamshaper } from "./useDreamshaper";
import { BroadcastWithControls } from "@/components/playground/broadcast";
import { Hammer, Loader2 } from "lucide-react";
import { LPPLayer } from "@/components/playground/player";
import Link from "next/link";

const PROMPT_INTERVAL = 2000;
const samplePrompts = examplePrompts.map((prompt) => prompt.prompt);

// Rotate through prompts every 2 seconds
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

export default function Dreamshaper() {
  const isMac =
    typeof navigator !== "undefined"
      ? (navigator.userAgent?.includes("Mac") ?? false)
      : false;
  const { currentPromptIndex } = usePrompts();
  const [inputValue, setInputValue] = useState("");
  const { outputPlaybackId, streamUrl, handleUpdate, loading } =
    useDreamshaper();

  const submitPrompt = () => {
    if (inputValue) {
      handleUpdate(inputValue);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Header section */}
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-bold">Livepeer Pipelines</h1>
        <p className="text-muted-foreground">
          Transform your video in real-time with AI - and build your own
          workflow with ComfyUI
        </p>
      </div>

      {/* Top section with prompt input */}
      <div className="flex-shrink-0 flex">
        <div className="relative w-[calc(90%-0.5rem)]">
          <div className="relative">
            <AnimatePresence mode="wait">
              {!inputValue && (
                <motion.span
                  key={currentPromptIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.5, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="h-9 absolute left-3 top-[0.35rem] -translate-y-1/2 text-muted-foreground pointer-events-none"
                >
                  {samplePrompts[currentPromptIndex]}
                </motion.span>
              )}
            </AnimatePresence>
            <Input
              className="w-full pr-[140px]"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="absolute right-0 top-1/2 -translate-y-1/2"
                  disabled={!inputValue}
                  onClick={submitPrompt}
                >
                  Apply
                </Button>
              </TooltipTrigger>

              <TooltipContent>
                {isMac ? "⌘ + Enter" : "Ctrl + Enter"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <Link
          href="https://pipelines.livepeer.org/docs/knowledge-base/get-started/what-is-pipeline"
          target="_blank"
        >
          <Button variant="outline" className="hidden md:flex right-0">
            <Hammer className="w-4 h-4" />
            <span>Build your own pipeline</span>
          </Button>
        </Link>
      </div>

      {/* Main content area */}
      <div className="flex-1 min-h-0">
        <div className="w-full h-full">
          <div className="w-full h-full">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : outputPlaybackId ? (
              <LPPLayer output_playback_id={outputPlaybackId} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Waiting for stream to start...
              </div>
            )}
          </div>

          <div className="absolute bottom-6 right-12 w-1/2 md:w-1/5 bg-sidebar overflow-hidden rounded-lg shadow-lg">
            {loading || !streamUrl ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <BroadcastWithControls ingestUrl={streamUrl} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
