import React, { useMemo } from "react";
import { ArrowLeft, Sparkle, Heart } from "lucide-react";
import { GradientAvatar } from "@/components/GradientAvatar";
import { PromptItem } from "@/app/api/prompts/types";
import { Button } from "@repo/design-system/components/ui/button";
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
  onLikeClick?: (prompt: string) => void;
  likedPrompts?: Set<string>;
  isMobile?: boolean;
  isTrending?: boolean;
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
  onLikeClick,
  likedPrompts = new Set(),
  isMobile = false,
  isTrending = false,
}: PromptDisplayProps) {
  const MAX_QUEUE_SIZE = 5;
  const MAX_MOBILE_PROMPTS = 4;

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
  const nonEmptyQueueItems = filledQueue.filter(item => item.text !== "");

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

    if (nonHighlightedPrompts.length > 0) {
      const reversedPastPrompts = [...nonHighlightedPrompts].reverse();
      const pastPromptsToShow = reversedPastPrompts.slice(0, maxItems - 1);

      pastPromptsToShow.forEach(prompt => {
        const index =
          nonHighlightedPrompts.length - reversedPastPrompts.indexOf(prompt);
        const isUserPrompt = userPromptIndices[index];
        const seed = promptAvatarSeeds[index];

        itemsToShow.push({
          type: "past",
          text: prompt,
          isUser: isUserPrompt,
          seed: seed,
        });

        itemCount++;
      });
    }

    if (itemCount < maxItems && highlightedPrompt) {
      itemsToShow.push({
        type: "highlighted",
        text: highlightedPrompt,
        isUser: userPromptIndices[0],
        seed: promptAvatarSeeds[0],
      });

      itemCount++;
    }

    if (itemCount < maxItems && nonEmptyQueueItems.length > 0) {
      const queueItemsToShow = nonEmptyQueueItems.slice(
        0,
        maxItems - itemCount,
      );

      queueItemsToShow.forEach(item => {
        itemsToShow.push({
          type: "queue",
          text: item.text,
          isUser: item.isUser,
          seed: item.seed,
        });
      });
    }

    return (
      <div className="w-full flex flex-col justify-end p-4 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col gap-2 w-full justify-end">
          {itemsToShow.map((item, index) => {
            const username = item.seed ? generateUsername(item.seed) : "User";
            const color = getColorFromSeed(username);

            return (
              <div
                key={`mobile-item-${index}-${item.text.substring(0, 10)}`}
                className={`p-2 px-3 text-sm rounded-xl w-full 
                  ${
                    item.type === "highlighted"
                      ? "text-white font-bold border border-white/90 backdrop-blur-sm"
                      : "text-white/80 italic"
                  }
                  ${item.isUser ? "font-medium" : ""}
                  ${onPastPromptClick ? "cursor-pointer" : ""}`}
                style={{
                  transition: "all 0.3s ease-out",
                  borderRadius: "12px",
                }}
                onClick={() =>
                  onPastPromptClick && onPastPromptClick(item.text)
                }
              >
                <div className="min-w-0 flex-1 flex items-center justify-between">
                  <span className="truncate block w-full">{item.text}</span>
                  {onLikeClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-1 h-8 w-8 ${
                        likedPrompts.has(item.text)
                          ? "text-red-500"
                          : "text-white/50"
                      }`}
                      onClick={e => {
                        e.stopPropagation();
                        onLikeClick(item.text);
                      }}
                    >
                      <Heart
                        className="h-4 w-4"
                        fill={
                          likedPrompts.has(item.text) ? "currentColor" : "none"
                        }
                      />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
                  className={`p-2 px-3 text-sm md:text-base text-gray-500 italic flex items-center rounded-xl w-full ${
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
                  <div className="min-w-0 flex-1 flex items-center justify-between">
                    <span className="truncate block w-full">{prevPrompt}</span>
                    {!isTrending && onLikeClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`p-1 h-8 w-8 ${
                          likedPrompts.has(prevPrompt)
                            ? "text-red-500"
                            : "text-gray-400"
                        }`}
                        onClick={e => {
                          e.stopPropagation();
                          onLikeClick(prevPrompt);
                        }}
                      >
                        <Heart
                          className="h-4 w-4"
                          fill={
                            likedPrompts.has(prevPrompt)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </Button>
                    )}
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
            <div className="min-w-0 flex-1 flex items-center justify-between">
              <span className="truncate block w-full">{highlightedPrompt}</span>
              {isTrending ? (
                <span className="text-lg">🔥</span>
              ) : (
                onLikeClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-1 h-8 w-8 ${
                      likedPrompts.has(highlightedPrompt)
                        ? "text-red-500"
                        : "text-gray-400"
                    }`}
                    onClick={e => {
                      e.stopPropagation();
                      onLikeClick(highlightedPrompt);
                    }}
                  >
                    <Heart
                      className="h-4 w-4"
                      fill={
                        likedPrompts.has(highlightedPrompt)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </Button>
                )
              )}
            </div>
          </div>
        )}

        {nonEmptyQueueItems.length > 0 && (
          <div className="hidden md:flex flex-col gap-2 w-full">
            {nonEmptyQueueItems.map((queuedPrompt, qIndex) => {
              const username = queuedPrompt.seed
                ? generateUsername(queuedPrompt.seed)
                : "User";
              const color = getColorFromSeed(username);

              return (
                <div
                  key={`queue-${qIndex}-${queuedPrompt.text.substring(0, 10)}`}
                  className={`rounded-xl text-gray-500 italic flex items-center text-sm md:text-base w-full ${
                    queuedPrompt.isUser ? "font-medium" : ""
                  }`}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "12px",
                  }}
                >
                  <div className="hidden" style={{ color: color }}>
                    {username.substring(0, 6)}
                  </div>
                  <div className="min-w-0 flex-1 flex items-center justify-between">
                    <span className="truncate block w-full">
                      {queuedPrompt.text}
                    </span>
                    {!isTrending && onLikeClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`p-1 h-8 w-8 hover:bg-transparent hover:opacity-100 ${
                          likedPrompts.has(queuedPrompt.text)
                            ? "text-red-500"
                            : "text-gray-400"
                        }`}
                        onClick={e => {
                          e.stopPropagation();
                          onLikeClick(queuedPrompt.text);
                        }}
                      >
                        <Heart
                          className="h-4 w-4"
                          fill={
                            likedPrompts.has(queuedPrompt.text)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </Button>
                    )}
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
