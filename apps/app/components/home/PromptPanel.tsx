import React from "react";
import { Camera } from "lucide-react";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { PromptForm } from "./PromptForm";
import { PromptDisplay } from "./PromptDisplay";
import { ActionButton } from "./ActionButton";
import { PromptItem } from "@/app/api/prompts/types";
import { TrackedButton } from "@/components/analytics/TrackedButton";

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
    window.open("https://discord.gg/livepeer", "_blank");
  };

  return (
    <div
      className="w-full md:w-[30%] flex flex-col overflow-hidden max-h-[50vh] md:max-h-none fixed bottom-0 left-0 right-0 md:relative"
      style={{
        position: "relative",
        background: "linear-gradient(180deg, #FFFFFF 0%, #B9D1DD 100%)",
        padding: "1px",
        borderRadius: "12px",
      }}
    >
      <div
        className="w-full h-full flex flex-col"
        style={{
          backgroundColor: "#FBFBFB",
          borderRadius: "11px",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden pointer-events-none"></div>

        <div className="flex flex-col h-full justify-between">
          <div className="flex space-x-0 justify-between items-center">
            <div className="p-4 pl-6 flex-1">
              <h2 className="text-xl font-semibold text-gray-800 hidden">
                Prompt history
              </h2>
            </div>
            <div className="flex justify-end -mt-1">
              <ActionButton
                trackingEvent="explore_header_start_creating_clicked"
                trackingProperties={{ location: "explore_header" }}
                onClick={onTryCameraClick}
                icon={
                  buttonText === "Join Discord" ? (
                    <DiscordLogoIcon className="h-4 w-4" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )
                }
              >
                <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm whitespace-nowrap overflow-hidden">
                  {buttonText === "Try it with your camera" ? (
                    <>
                      <span className="hidden xs:inline">
                        Try it with your camera
                      </span>
                      <span className="inline xs:hidden">
                        Try it with your camera
                      </span>
                    </>
                  ) : (
                    buttonText
                  )}
                </span>
              </ActionButton>
            </div>
          </div>

          <div className="hidden md:flex p-4 pl-6 border-t border-gray-200/30 flex-row gap-3 w-full relative z-10">
            <TrackedButton
              className="w-full px-4 py-2 h-10 rounded-md bg-white text-black hover:bg-gray-100 flex items-center justify-center gap-2"
              onClick={handleJoinDiscordClick}
              trackingEvent="explore_header_community_clicked"
              trackingProperties={{ location: "explore_header" }}
            >
              <DiscordLogoIcon className="h-4 w-4" />
              Join Discord
            </TrackedButton>
          </div>

          <div className="flex-1 flex flex-col justify-end overflow-hidden relative">
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
            />
          </div>

          <PromptForm
            onSubmit={onSubmit}
            value={promptValue}
            onChange={onPromptChange}
            isThrottled={isThrottled}
            throttleTimeLeft={throttleTimeLeft}
          />
        </div>
      </div>
    </div>
  );
}
