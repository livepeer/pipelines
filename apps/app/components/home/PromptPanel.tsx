import React, { RefObject, useMemo, useState, useEffect } from "react";
import { Camera, Flame, TrendingUp } from "lucide-react";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { PromptForm } from "./PromptForm";
import { PromptDisplay } from "./PromptDisplay";
import { ActionButton } from "./ActionButton";
import { PromptItem } from "@/app/api/prompts/types";
import { TrackedButton } from "@/components/analytics/TrackedButton";
import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { Separator } from "@repo/design-system/components/ui/separator";
import { L } from "vitest/dist/chunks/reporters.D7Jzd9GS.js";

// Full list of trending prompts
const allTrendingPrompts = [
  {
    display: "Guybrush Threepwood",
    prompt:
      "guybrush threepwood ((flat color)) studio ghibli --creativity 0.4 --quality 2",
  },
  {
    display: "Bender Robot",
    prompt:
      "bender robot ((flat color)) studio ghibli --creativity 0.3 --quality 5",
  },
  {
    display: "Vitruvian Blueprint",
    prompt:
      "((blueprint)) vitruvian ((flat colors)) --creativity 0.35 --quality 5 --denoise 0.9",
  },
  {
    display: "Claymation Muppet",
    prompt:
      "sculpture ((claymation)) muppet sunglasses --creativity 0.6 --quality 3",
  },
  {
    display: "Studio Ghibli",
    prompt: "studio ghibli (watercolor) :: ((flat colors)) --quality 3",
  },
  {
    display: "Seraphim",
    prompt:
      "no face, multiple eyes on face and body,Seraphim ((flat colors)) --quality 3 --creativity 0.3",
  },
  {
    display: "Water Life Form",
    prompt:
      "(organic water life form:1.2) :: flowing liquid :: futuristic :: darkfantasy :: merfolk --creativity 0.4",
  },
  {
    display: "Bender Studio",
    prompt:
      "bender robot ((flat color)) studio ghibli --creativity 0.3 --quality 2",
  },
  {
    display: "Anime Style",
    prompt:
      "anime-style illustration, detailed line art, vibrant colors, large expressive eyes, cel-shading, soft lighting, cinematic composition, dynamic pose --quality 3",
  },
  {
    display: "Ink Art",
    prompt:
      "((ink illustration, clean linework, sharp contrast)) :: cyan, magenta, chartreuse, orange :: high resolution, bold color separation --quality 5 --creativity 0.6",
  },
  {
    display: "Polar Bear",
    prompt:
      "a sad white (polar bear) sitting in antarctica, front view --quality 5",
  },
  {
    display: "Cubist Portrait",
    prompt:
      "((cubism)) Taylor swift ((flat colors)) --creativity 0.6 --quality 3",
  },
  {
    display: "Young Frankenstein",
    prompt:
      "Young Frankenstein Gene Wilder ((lightning)) black and white --quality 3 --creativity 0.65",
  },
  {
    display: "Bohemian Rhapsody",
    prompt: "bohemian rhapsody, black background, illuminated faces",
  },
  {
    display: "Yoda",
    prompt:
      "(yoda:1.2), Star Wars, Brown Robe, Green Skin, Big Ears, (Green Light Saber:1.2) --denoise 1.0 --creativity 1.0 --negative-prompt human",
  },
  {
    display: "Frankenstein",
    prompt: "frankenstein ((lightning)) --quality 3 --creativity 0.6",
  },
];

const getPromptQueueText = (length: number) => {
  if (length === 0) {
    return "No prompts in queue";
  }
  if (length === 1) {
    return "1 prompt in queue";
  }
  return `${length} prompts in queue`;
};

interface PromptPanelProps {
  promptQueue: PromptItem[];
  displayedPrompts: string[];
  promptAvatarSeeds: string[];
  userPromptIndices: boolean[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  promptValue: string;
  onPromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  setPromptValue: (value: string) => void;
  isThrottled: boolean;
  throttleTimeLeft: number;
  promptFormRef?: RefObject<HTMLFormElement>;
  isMobile?: boolean;
}

export function PromptPanel({
  promptQueue,
  displayedPrompts,
  promptAvatarSeeds,
  userPromptIndices,
  onSubmit,
  promptValue,
  onPromptChange,
  setPromptValue,
  isThrottled,
  throttleTimeLeft,
  promptFormRef,
  isMobile = false,
}: PromptPanelProps) {
  const [highlightInput, setHighlightInput] = useState(false);

  const handlePastPromptClick = (prompt: string) => {
    setPromptValue(prompt);
  };

  // Randomly select 3 prompts on each render
  const trendingPrompts = useMemo(() => {
    const shuffled = [...allTrendingPrompts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, []);

  const handleTrendingPromptClick = (prompt: string) => {
    setPromptValue(prompt);
    // Add highlight effect when a trending prompt is clicked
    setHighlightInput(true);

    // Reset the highlight effect after animation completes
    setTimeout(() => {
      setHighlightInput(false);
    }, 2400); // Increased time to match our animations
  };

  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(
    navigator.userAgent,
  );
  return (
    <div
      className={cn(
        "flex flex-col justify-end flex-1",
        isMobile
          ? `w-full pb-4 overflow-hidden bg-transparent border-none px-2`
          : "md:w-[30%]",
        isMobile && isSafari && "pb-16",
      )}
    >
      {/* Trending prompts section - completely separate box */}
      {!isMobile && (
        <div className="w-full mb-3">
          <div
            className="w-full bg-white rounded-lg p-3"
            style={{
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              borderRadius: "8px",
            }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Flame className="h-4 w-4 text-orange-500" />
              <div className="text-sm font-semibold text-black">Trending</div>
            </div>
            <div className="flex gap-2">
              {trendingPrompts.map((item, index) => (
                <TrackedButton
                  key={index}
                  variant="outline"
                  size="sm"
                  className="alwaysAnimatedButton rounded-md text-xs flex-1 min-w-0"
                  onClick={() => handleTrendingPromptClick(item.prompt)}
                  trackingEvent="trending_prompt_clicked"
                  trackingProperties={{
                    prompt: item.prompt,
                    display_text: item.display,
                    index,
                  }}
                >
                  <span className="truncate">{item.display}</span>
                </TrackedButton>
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          "w-full h-full flex flex-col bg-[#FBFBFB] rounded-xl",
          isMobile
            ? "bg-white h-fit overflow-hidden z-[999] border border-gray-200 py-4"
            : "md:rounded-xl overflow-hidden",
        )}
      >
        <div
          className={cn(
            "flex-1 flex flex-col justify-end overflow-hidden relative rounded-xl custom",
            isMobile && "rounded-none",
          )}
        >
          <div
            className="md:block hidden absolute top-0 left-0 right-0 h-[60%] pointer-events-none z-30"
            style={{
              background:
                "linear-gradient(rgb(251, 251, 251) 0%, rgba(251, 251, 251, 0.7) 3%, rgba(251, 251, 251, 0.5) 5%, rgba(251, 251, 251, 0.3) 38%, transparent 80%)",
            }}
          ></div>
          <div
            className="md:block hidden absolute top-0 left-0 right-0 h-[50%] pointer-events-none z-20"
            style={{
              background:
                "linear-gradient(to bottom, rgba(206, 223, 228, 0.6) 0%, rgba(206, 223, 228, 0.5) 40%, rgba(206, 223, 228, 0.4) 60%, rgba(206, 223, 228, 0.2) 80%, rgba(254, 254, 254, 0.05) 90%, rgba(254, 254, 254, 0) 100%)",
            }}
          ></div>
          <div
            className="md:block hidden absolute top-0 left-0 right-0 h-[50%] pointer-events-none z-20"
            style={{
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
              maskImage:
                "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.05) 90%, rgba(0,0,0,0) 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.05) 90%, rgba(0,0,0,0) 100%)",
            }}
          ></div>

          <PromptDisplay
            promptQueue={promptQueue}
            displayedPrompts={displayedPrompts}
            promptAvatarSeeds={promptAvatarSeeds}
            userPromptIndices={userPromptIndices}
            onPastPromptClick={handlePastPromptClick}
            isMobile={isMobile}
          />
        </div>

        <div
          className={cn(
            "flex flex-row gap-2 overflow-x-auto mb-4 px-4",
            isMobile ? "flex mt-4" : "hidden",
          )}
        >
          {trendingPrompts.map((item, index) => (
            <TrackedButton
              key={index}
              variant="outline"
              size="sm"
              className="text-xs flex-1 min-w-0 bg-white rounded-full"
              onClick={() => handleTrendingPromptClick(item.prompt)}
              trackingEvent="trending_prompt_clicked"
              trackingProperties={{
                prompt: item.prompt,
                display_text: item.display,
                index,
              }}
            >
              <span className="truncate">{item.display}</span>
            </TrackedButton>
          ))}
        </div>

        <PromptForm
          ref={promptFormRef}
          onSubmit={onSubmit}
          value={promptValue}
          onChange={onPromptChange}
          isThrottled={isThrottled}
          throttleTimeLeft={throttleTimeLeft}
          isMobile={isMobile}
          highlight={highlightInput}
        />
      </div>
    </div>
  );
}
