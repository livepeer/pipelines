import React from "react";
import { Camera } from "lucide-react";
import { PromptForm } from "./PromptForm";
import { PromptDisplay } from "./PromptDisplay";
import { ActionButton } from "./ActionButton";
import { PromptItem } from "@/app/api/prompts/types";

interface PromptPanelProps {
  promptQueue: PromptItem[];
  displayedPrompts: string[];
  promptAvatarSeeds: string[];
  userPromptIndices: boolean[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  promptValue: string;
  onPromptChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isThrottled: boolean;
  throttleTimeLeft: number;
  onTryCameraClick: () => void;
}

export function PromptPanel({
  promptQueue,
  displayedPrompts,
  promptAvatarSeeds,
  userPromptIndices,
  onSubmit,
  promptValue,
  onPromptChange,
  isThrottled,
  throttleTimeLeft,
  onTryCameraClick,
}: PromptPanelProps) {
  return (
    <div className="w-full md:w-[30%] flex flex-col md:bg-white/10 md:backdrop-blur-sm rounded-lg md:rounded-lg overflow-hidden max-h-[50vh] md:max-h-none fixed bottom-0 left-0 right-0 md:relative">
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden pointer-events-none"></div>

      <PromptForm
        onSubmit={onSubmit}
        value={promptValue}
        onChange={onPromptChange}
        isThrottled={isThrottled}
        throttleTimeLeft={throttleTimeLeft}
      />

      <PromptDisplay
        promptQueue={promptQueue}
        displayedPrompts={displayedPrompts}
        promptAvatarSeeds={promptAvatarSeeds}
        userPromptIndices={userPromptIndices}
      />

      <ActionButton
        onClick={onTryCameraClick}
        icon={<Camera className="h-4 w-4" />}
      >
        Try it with your camera
      </ActionButton>
    </div>
  );
}
