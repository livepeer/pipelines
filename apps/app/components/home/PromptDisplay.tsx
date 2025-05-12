import React from "react";
import { ArrowLeft, Sparkle } from "lucide-react";
import { GradientAvatar } from "@/components/GradientAvatar";
import { PromptItem } from "@/app/api/prompts/types";

interface PromptDisplayProps {
  promptQueue: PromptItem[];
  displayedPrompts: string[];
  promptAvatarSeeds: string[];
  userPromptIndices: boolean[];
  onPastPromptClick?: (prompt: string) => void;
}

export function PromptDisplay({
  promptQueue,
  displayedPrompts,
  promptAvatarSeeds,
  userPromptIndices,
  onPastPromptClick,
}: PromptDisplayProps) {
  const MAX_QUEUE_SIZE = 5;

  const getFilledQueue = () => {
    const filledQueue = [...promptQueue];
    if (filledQueue.length < MAX_QUEUE_SIZE) {
      const emptyCount = MAX_QUEUE_SIZE - filledQueue.length;
      for (let i = 0; i < emptyCount; i++) {
        filledQueue.push({
          text: "",
          seed: `empty-${i}`,
          isUser: false,
          timestamp: 0,
        });
      }
    }
    return filledQueue;
  };

  const filledQueue = getFilledQueue();
  const nonHighlightedPrompts = displayedPrompts.slice(1);
  const highlightedPrompt = displayedPrompts[0];

  return (
    <div className="flex-1 max-h-[25vh] md:max-h-none p-4 flex flex-col md:justify-end justify-end overflow-hidden order-first md:order-none relative z-10 mt-auto">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 md:hidden pointer-events-none z-0"></div>
      <div className="space-y-0.5 flex flex-col relative z-10">
        {nonHighlightedPrompts.length > 0 && (
          <div className="flex flex-col gap-0.5 mb-1">
            {[...nonHighlightedPrompts].reverse().map((prevPrompt, rIndex) => {
              const index = nonHighlightedPrompts.length - rIndex;
              const itemOpacity = Math.max(0.3, 1 - index * 0.15);
              const itemScale = Math.max(0.94, 1 - index * 0.015);
              const isUserPrompt = userPromptIndices[index];

              return (
                <div
                  key={`prompt-past-${index}-${prevPrompt.substring(0, 10)}`}
                  className={`p-2 text-sm md:text-base text-gray-500 italic flex items-center ${
                    isUserPrompt
                      ? "font-medium md:bg-black/5 md:backdrop-blur-[1px]"
                      : ""
                  } ${index !== 0 ? "mobile-slide-up" : ""} ${
                    isUserPrompt ? "relative overflow-hidden" : ""
                  } mobile-fade-${index} ${onPastPromptClick ? "cursor-pointer hover:bg-black/5 hover:backdrop-blur-[1px]" : ""}`}
                  style={{
                    opacity: itemOpacity,
                    transition: "all 0.3s ease-out",
                    transform: `translateY(0) scale(${itemScale})`,
                    transformOrigin: "left center",
                    animation: "slideDown 0.3s ease-out",
                  }}
                  onClick={() =>
                    onPastPromptClick && onPastPromptClick(prevPrompt)
                  }
                >
                  {isUserPrompt && (
                    <div
                      className="absolute inset-0 -z-10 bg-black/5 backdrop-blur-[1px] rounded-lg md:hidden"
                      style={{ opacity: Math.min(1, itemOpacity + 0.2) }}
                    ></div>
                  )}
                  <div
                    className="mr-2 flex-shrink-0"
                    style={{ opacity: itemOpacity }}
                  >
                    <GradientAvatar seed={promptAvatarSeeds[index]} size={16} />
                  </div>
                  <span className="truncate">{prevPrompt}</span>
                </div>
              );
            })}
          </div>
        )}

        {highlightedPrompt && (
          <div
            key={`prompt-highlighted-${highlightedPrompt.substring(0, 10)}`}
            className={`p-2 text-sm md:text-base text-white md:text-black font-bold flex items-center animate-fadeSlideIn relative ${onPastPromptClick ? "cursor-pointer hover:bg-black/5" : ""}`}
            style={{
              opacity: 1,
              transition: "all 0.3s ease-out",
              transform: "translateY(0)",
              transformOrigin: "left center",
              animation: "fadeSlideIn 0.3s ease-out",
            }}
            onClick={() =>
              onPastPromptClick && onPastPromptClick(highlightedPrompt)
            }
          >
            <div className="absolute -inset-0.5 border-2 border-black rounded-lg"></div>
            <div
              className="absolute left-0 top-1/2 -ml-3 -mt-2 w-0 h-0 
              border-t-[8px] border-t-transparent 
              border-r-[10px] border-r-black 
              border-b-[8px] border-b-transparent"
            ></div>
            <ArrowLeft className="hidden md:hidden h-3 w-3 mr-2 stroke-2 flex-shrink-0" />
            <Sparkle className="md:inline h-4 w-4 mr-2 stroke-2 flex-shrink-0" />
            <span className="truncate">{highlightedPrompt}</span>
          </div>
        )}

        {filledQueue.length > 0 && (
          <div className="hidden md:flex flex-col gap-0.5 mt-1">
            {[...filledQueue].reverse().map((queuedPrompt, qIndex) => {
              const queuePosition = filledQueue.length - qIndex - 1;
              const queueOpacity = Math.max(0.4, 1 - queuePosition * 0.15);
              const queueScale = Math.max(0.94, 1 - queuePosition * 0.015);
              const isEmpty = queuedPrompt.text === "";

              return (
                <div
                  key={`queue-${qIndex}-${isEmpty ? "empty" : queuedPrompt.text.substring(0, 10)}`}
                  className={`rounded-lg text-gray-500 italic flex items-center text-sm md:text-base ${
                    queuedPrompt.isUser ? "bg-black/5 backdrop-blur-[1px]" : ""
                  }`}
                  style={{
                    animation: "slideDown 0.3s ease-out",
                    opacity: isEmpty ? 0 : queueOpacity,
                    transform: `scale(${queueScale})`,
                    transformOrigin: "left center",
                    height: isEmpty ? 0 : "auto",
                    padding: isEmpty ? 0 : "0.5rem",
                    margin: isEmpty ? 0 : undefined,
                    overflow: "hidden",
                  }}
                >
                  <div className="mr-2 flex-shrink-0">
                    <GradientAvatar seed={queuedPrompt.seed} size={16} />
                  </div>
                  <span className="truncate">
                    {isEmpty ? "Waiting for prompt..." : queuedPrompt.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
