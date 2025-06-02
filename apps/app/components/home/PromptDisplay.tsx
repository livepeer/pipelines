import React, { useMemo } from "react";
import { ArrowLeft, Sparkle } from "lucide-react";
import { GradientAvatar } from "@/components/GradientAvatar";
import { PromptItem } from "@/app/api/prompts/types";
import {
  uniqueNamesGenerator,
  Config,
  colors,
  animals,
  NumberDictionary,
} from "unique-names-generator";

interface PromptDisplayProps {
  promptQueue: PromptItem[];
  displayedPrompts: string[];
  promptAvatarSeeds: string[];
  userPromptIndices: boolean[];
  onPastPromptClick?: (prompt: string) => void;
  isMobile?: boolean;
}

// Types for the combined items in mobile view
type HighlightedItem = {
  text: string;
  isHighlighted: true;
  isPast?: undefined;
  seed?: undefined;
  isUser?: undefined;
};

type PastItem = {
  text: string;
  isPast: true;
  isHighlighted?: undefined;
  seed?: undefined;
  isUser?: undefined;
};

type QueueItem = PromptItem & {
  isPast?: undefined;
  isHighlighted?: undefined;
};

type CombinedItem = HighlightedItem | PastItem | QueueItem;

const numberDictionary = NumberDictionary.generate({ min: 10, max: 68 });
const nameConfig: Config = {
  dictionaries: [animals],
  separator: "",
  length: 1,
  style: "capital",
};

const usernameCache = new Map<string, string>();
const colorCache = new Map<string, string>();

const generateUsername = (seed: string): string => {
  if (usernameCache.has(seed)) {
    return usernameCache.get(seed)!;
  }

  const config = { ...nameConfig, seed };
  const username = uniqueNamesGenerator(config);
  usernameCache.set(seed, username);
  return username;
};

const getPromptQueueText = (index: number) => {
  if (index === 1) {
    return "1st in queue";
  }
  if (index === 2) {
    return "2nd in queue";
  }
  if (index === 3) {
    return "3rd in queue";
  }
  return `${index}th in queue`;
};

const getColorFromSeed = (seed: string): string => {
  if (colorCache.has(seed)) {
    return colorCache.get(seed)!;
  }

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash % 360);

  const saturation = 85 + Math.abs((hash >> 8) % 15);
  const lightness = 25 + Math.abs((hash >> 16) % 20);

  const adjustedLightness =
    hue >= 60 && hue <= 150 ? Math.max(15, lightness - 15) : lightness;

  const color = `hsl(${hue}, ${saturation}%, ${adjustedLightness}%)`;
  colorCache.set(seed, color);
  return color;
};

export function PromptDisplay({
  promptQueue,
  displayedPrompts,
  promptAvatarSeeds,
  userPromptIndices,
  onPastPromptClick,
  isMobile = false,
}: PromptDisplayProps) {
  const MAX_QUEUE_SIZE = 5;
  const MAX_MOBILE_PROMPTS = 25;

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
  const nonEmptyQueueItems = filledQueue.filter(
    item => item && item.text && item.text.trim() !== "",
  );

  useMemo(() => {
    promptAvatarSeeds.forEach(seed => {
      if (seed && !usernameCache.has(seed)) {
        const username = generateUsername(seed);
        getColorFromSeed(username);
      }
    });

    filledQueue.forEach(item => {
      if (item.seed && !usernameCache.has(item.seed)) {
        const username = generateUsername(item.seed);
        getColorFromSeed(username);
      }
    });
  }, []);

  if (isMobile) {
    let itemsToShow = [];
    let itemCount = 0;
    const maxItems = MAX_MOBILE_PROMPTS;

    // Create a combined chronological order list (oldest to newest, including current)
    const allPromptsChronological = [];

    // First add past prompts in reverse chronological order (oldest first)
    if (nonHighlightedPrompts.length > 0) {
      // nonHighlightedPrompts is already in reverse chronological order (newest first)
      // so we need to reverse it to get oldest first
      const oldestToNewest = [...nonHighlightedPrompts].reverse();

      // Add all the past prompts (they'll be oldest to newest)
      oldestToNewest.forEach((prompt, idx) => {
        const originalIndex = nonHighlightedPrompts.length - idx;
        allPromptsChronological.push({
          type: "past",
          text: prompt,
          isUser: userPromptIndices[originalIndex],
          seed: promptAvatarSeeds[originalIndex],
        });
      });
    }

    // Then add highlighted prompt (which is the newest)
    if (highlightedPrompt) {
      allPromptsChronological.push({
        type: "highlighted",
        text: highlightedPrompt,
        isUser: userPromptIndices[0],
        seed: promptAvatarSeeds[0],
      });
    }

    // Add queue items first, before limiting the display size
    if (nonEmptyQueueItems.length > 0) {
      nonEmptyQueueItems.forEach(item => {
        // Safe access with fallbacks
        const itemText = item?.text || "";
        const itemSeed = item?.seed || "fallback";
        const itemIsUser = item?.isUser || false;

        // Only add if text exists
        if (itemText.trim()) {
          allPromptsChronological.push({
            type: "queue",
            text: itemText,
            isUser: itemIsUser,
            seed: itemSeed,
          });
        }
      });
    }

    // Take only the most recent N items to fit into our display
    itemsToShow = allPromptsChronological.slice(-maxItems);
    itemCount = itemsToShow.length;

    const userSubmittedPromptsInQueue = nonEmptyQueueItems.filter(
      item => item && item.isUser && item.text && item.text.trim(),
    );
    return (
      <div className="flex flex-col gap-1 px-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-light">
            Current prompt:
          </label>
          <p className="text-sm text-foreground font-bold line-clamp-1">
            {displayedPrompts[0]}
          </p>
        </div>
        {userSubmittedPromptsInQueue.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-light">
              Submitted prompt:
            </label>
            <div className="flex flex-row gap-2 line-clamp-1 align-bottom">
              <p className="flex-1 text-sm text-foreground font-bold line-clamp-1">
                {userSubmittedPromptsInQueue[
                  userSubmittedPromptsInQueue.length - 1
                ]?.text || "Loading..."}
              </p>
              <p className="text-xs text-gray-500 font-light text-right">
                {getPromptQueueText(userSubmittedPromptsInQueue.length)}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col justify-end p-4 pb-0 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 md:hidden pointer-events-none z-0"></div>
      <div className="flex flex-col gap-2 relative z-10 w-full mb-4">
        {nonHighlightedPrompts.length > 0 && (
          <div className="flex flex-col gap-2 w-full">
            {[...nonHighlightedPrompts].reverse().map((prevPrompt, rIndex) => {
              const index = nonHighlightedPrompts.length - rIndex;
              const isUserPrompt = userPromptIndices[index];
              const seed = promptAvatarSeeds[index];
              const username = seed ? generateUsername(seed) : "User";
              const color = getColorFromSeed(username);

              return (
                <div
                  key={`prompt-past-${index}-${prevPrompt.substring(0, 10)}`}
                  className={`p-2 px-3 text-sm text-[#282828] font-light italic flex items-center rounded-xl w-full ${
                    isUserPrompt ? "font-medium" : ""
                  } ${onPastPromptClick ? "cursor-pointer hover:bg-black/5 hover:backdrop-blur-[1px]" : ""}`}
                  style={{
                    transition: "all 0.3s ease-out",
                    borderRadius: "12px",
                  }}
                  onClick={() =>
                    onPastPromptClick && onPastPromptClick(prevPrompt)
                  }
                >
                  <div
                    className="hidden"
                    style={{
                      color: color,
                    }}
                  >
                    {username.substring(0, 6)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="truncate block w-full">{prevPrompt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {highlightedPrompt && (
          <div
            key={`prompt-highlighted-${highlightedPrompt.substring(0, 10)}`}
            className={`p-3 px-4 text-sm md:text-base text-white md:text-black font-bold flex items-center animate-fadeSlideIn relative alwaysAnimatedButton bg-white/90 rounded-xl w-full ${onPastPromptClick ? "cursor-pointer hover:bg-white" : ""}`}
            style={{
              transition: "all 0.3s ease-out",
              borderRadius: "12px",
            }}
            onClick={() =>
              onPastPromptClick && onPastPromptClick(highlightedPrompt)
            }
          >
            <div className="min-w-0 flex-1">
              <span className="truncate block w-full">{highlightedPrompt}</span>
            </div>
          </div>
        )}

        {nonEmptyQueueItems.length > 0 && (
          <div className="hidden md:flex flex-col gap-2 w-full">
            {nonEmptyQueueItems.map((queuedPrompt, qIndex) => {
              const promptText = queuedPrompt?.text || "";
              const promptSeed = queuedPrompt?.seed || `fallback-${qIndex}`;
              const isUserPrompt = queuedPrompt?.isUser || false;

              const username = promptSeed
                ? generateUsername(promptSeed)
                : "User";
              const color = getColorFromSeed(username);

              if (!promptText) {
                return null;
              }

              return (
                <div
                  key={`queue-${qIndex}-${promptText.substring(0, 10)}`}
                  className={`rounded-xl text-[#282828] font-light italic flex items-center text-sm w-full ${
                    isUserPrompt ? "font-medium" : ""
                  }`}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "12px",
                  }}
                >
                  <div className="hidden" style={{ color: color }}>
                    {username.substring(0, 6)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="truncate block w-full">{promptText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style jsx global>{`
        .alwaysAnimatedButton {
          border-radius: 12px !important;
        }
        .alwaysAnimatedButton::before {
          border-radius: 12px !important;
        }
      `}</style>
    </div>
  );
}
