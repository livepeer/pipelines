import React, { useMemo, useState } from "react";
import { PromptItem } from "@/app/api/prompts/types";

interface TrendingPromptDisplayProps {
  promptQueue: PromptItem[];
  displayedPrompts: string[];
  promptAvatarSeeds: string[];
  userPromptIndices: boolean[];
  onPastPromptClick?: (prompt: string) => void;
  isMobile?: boolean;
}

const usernameCache = new Map<string, string>();
const colorCache = new Map<string, string>();

const generateUsername = (seed: string): string => {
  if (usernameCache.has(seed)) {
    return usernameCache.get(seed)!;
  }
  // Simple username generator for trending
  const username = seed.slice(0, 6);
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

export function TrendingPromptDisplay({
  promptQueue,
  displayedPrompts,
  promptAvatarSeeds,
  userPromptIndices,
  onPastPromptClick,
  isMobile = false,
}: TrendingPromptDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const MAX_PER_ROW = 3;
  const DEFAULT_ROWS = 2;
  const EXPANDED_MAX = 10; // max 10 prompts
  const DEFAULT_MAX = MAX_PER_ROW * DEFAULT_ROWS; // 6

  useMemo(() => {
    promptAvatarSeeds.forEach(seed => {
      if (seed && !usernameCache.has(seed)) {
        const username = generateUsername(seed);
        getColorFromSeed(username);
      }
    });
  }, []);

  const promptsToShow = expanded
    ? displayedPrompts.slice(0, EXPANDED_MAX)
    : displayedPrompts.slice(0, DEFAULT_MAX);
  const showExpand = displayedPrompts.length > DEFAULT_MAX && displayedPrompts.length > 0;

  return (
    <div className="w-full flex flex-col justify-end p-2 pb-0 overflow-hidden relative">
      <div className="flex flex-row flex-wrap gap-2 relative z-10 w-full mb-4">
        {promptsToShow.map((prompt, idx) => (
          <div
            key={`trending-prompt-${idx}-${prompt.substring(0, 10)}`}
            className={`p-2 px-4 text-sm md:text-base text-white md:text-black font-bold flex items-center animate-fadeSlideIn relative alwaysAnimatedButton bg-white/90 rounded-xl ${onPastPromptClick ? "cursor-pointer hover:bg-white" : ""}`}
            style={{
              transition: "all 0.3s ease-out",
              borderRadius: "12px",
              minWidth: '180px',
              maxWidth: '320px',
              flex: '1 1 220px',
            }}
            onClick={() =>
              onPastPromptClick && onPastPromptClick(prompt)
            }
          >
            <div className="min-w-0 flex-1 flex items-center justify-between">
              <span className="truncate block w-full">{prompt}</span>
              <span className="text-lg">🔥</span>
            </div>
          </div>
        ))}
      </div>
      {showExpand && (
        <button
          className="mx-auto mb-2 px-4 py-1 rounded bg-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-300 transition-colors"
          onClick={() => setExpanded(e => !e)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
} 