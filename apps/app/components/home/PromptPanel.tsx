import React, { RefObject } from "react";
import { Camera } from "lucide-react";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { PromptForm } from "./PromptForm";
import { PromptDisplay } from "./PromptDisplay";
import { ActionButton } from "./ActionButton";
import { PromptItem } from "@/app/api/prompts/types";
import { TrackedButton } from "@/components/analytics/TrackedButton";
import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { Separator } from "@repo/design-system/components/ui/separator";

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
  const handlePastPromptClick = (prompt: string) => {
    setPromptValue(prompt);
  };

  // Calculate the height of the input container on mobile (approximately 76px)
  // 44px input height + 2 * 16px padding (p-4) = 76px
  const inputBoxHeight = 76;
  const footerHeight = 56; // Footer height
  const marginBottom = 15; // Margin between prompt panel and input box
  const safeAreaBottom = 20; // Extra padding for browser home bars
  const promptPanelBottom = footerHeight + inputBoxHeight + marginBottom;

  return (
    <div
      className={cn(
        "flex flex-col justify-end flex-1",
        isMobile
          ? "w-full pb-8 overflow-hidden bg-[#FBFBFB] border-none"
          : "md:w-[30%]",
      )}
    >
      <div
        className={cn(
          "flex justify-between items-center gap-2 h-12 px-4 pt-2",
          !isMobile && "hidden",
        )}
      >
        <p className="text-sm font-bold">Live Prompting</p>
        <p className="text-xs font-light">
          {promptQueue.length} prompts in queue
        </p>
      </div>
      <div
        className={cn(
          "w-full h-full flex flex-col bg-[#FBFBFB] rounded-xl",
          isMobile
            ? "rounded-none bg-transparent overflow-hidden"
            : "md:rounded-xl",
        )}
      >
        <div className="flex-1 flex flex-col justify-end overflow-hidden relative rounded-xl custom">
          <div
            className="absolute top-0 left-0 right-0 h-[60%] pointer-events-none z-30"
            style={{
              background:
                "linear-gradient(rgb(251, 251, 251) 0%, rgb(251, 251, 251) 3%, rgba(251, 251, 251, 0.9) 5%, rgba(251, 251, 251, 0.6) 38%, transparent 80%)",
            }}
          ></div>
          <div
            className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none z-20"
            style={{
              background:
                "linear-gradient(to bottom, var(--background, rgb(249, 250, 251)) 0%, var(--background, rgb(249, 250, 251)) 40%, var(--background, rgb(249, 250, 251)) 60%, rgba(249, 250, 251, 0.2) 80%, rgba(249, 250, 251, 0.05) 90%, rgba(249, 250, 251, 0) 100%)",
            }}
          ></div>
          <div
            className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none z-20"
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

        <div className="px-4 my-2 mb-4">
          <Separator orientation="horizontal" className="bg-[#CECECE]/40" />
        </div>

        <PromptForm
          ref={promptFormRef}
          onSubmit={onSubmit}
          value={promptValue}
          onChange={onPromptChange}
          isThrottled={isThrottled}
          throttleTimeLeft={throttleTimeLeft}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}
