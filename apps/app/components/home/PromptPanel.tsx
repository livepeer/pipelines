import React from "react";
import { Camera, MessageSquare } from "lucide-react";
import { PromptForm } from "./PromptForm";
import { PromptDisplay } from "./PromptDisplay";
import { ActionButton } from "./ActionButton";
import { Button } from "@repo/design-system/components/ui/button";
import { PromptItem } from "@/app/api/prompts/types";

interface PromptPanelProps {
  promptQueue: PromptItem[];
  displayedPrompts: string[];
  promptAvatarSeeds: string[];
  userPromptIndices: boolean[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  promptValue: string;
  onPromptChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setPromptValue: (value: string) => void;
  isThrottled: boolean;
  throttleTimeLeft: number;
  onTryCameraClick: () => void;
  buttonText?: string;
  isAuthenticated?: boolean;
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
  onTryCameraClick,
  buttonText = "Try it with your camera",
  isAuthenticated = false,
}: PromptPanelProps) {
  const handlePastPromptClick = (prompt: string) => {
    setPromptValue(prompt);
  };

  const handleJoinDiscordClick = () => {
    window.open("https://discord.gg/5sZu8xmn6U", "_blank");
  };

  return (
    <div className="w-full md:w-[30%] flex flex-col md:bg-white/10 md:backdrop-blur-sm rounded-lg md:rounded-lg overflow-hidden max-h-[50vh] md:max-h-none fixed bottom-0 left-0 right-0 md:relative">
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden pointer-events-none"></div>

      <div className="flex space-x-0">
        <ActionButton
          onClick={onTryCameraClick}
          icon={<Camera className="h-4 w-4" />}
        >
          {buttonText}
        </ActionButton>

        <div className="hidden md:flex p-4 pl-1 border-t border-gray-200/30 flex-row gap-3 w-full relative z-10">
          <Button
            className="w-full px-4 py-2 h-10 rounded-md bg-white text-black hover:bg-gray-100 flex items-center justify-center gap-2"
            onClick={handleJoinDiscordClick}
          >
            <MessageSquare className="h-4 w-4" />
            Join Discord
          </Button>
        </div>
      </div>

      <PromptDisplay
        promptQueue={promptQueue}
        displayedPrompts={displayedPrompts}
        promptAvatarSeeds={promptAvatarSeeds}
        userPromptIndices={userPromptIndices}
        onPastPromptClick={handlePastPromptClick}
      />

      <PromptForm
        onSubmit={onSubmit}
        value={promptValue}
        onChange={onPromptChange}
        isThrottled={isThrottled}
        throttleTimeLeft={throttleTimeLeft}
      />
    </div>
  );
}
