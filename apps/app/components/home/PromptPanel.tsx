import React, { useEffect } from "react";
import { Camera } from "lucide-react";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { PromptForm } from "./PromptForm";
import { PromptDisplay } from "./PromptDisplay";
import { ActionButton } from "./ActionButton";
import { PromptItem } from "@/app/api/prompts/types";
import { TrackedButton } from "@/components/analytics/TrackedButton";
import { Button } from "@repo/design-system/components/ui/button";

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
  onTryCameraClick: () => void;
  buttonText?: string;
  isAuthenticated?: boolean;
  isMobileView?: boolean;
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
  buttonText = "Pick your own video",
  isAuthenticated = false,
  isMobileView = false,
}: PromptPanelProps) {
  const handlePastPromptClick = (prompt: string) => {
    setPromptValue(prompt);
  };

  const handleJoinDiscordClick = () => {
    window.open("https://discord.gg/5sZu8xmn6U", "_blank");
  };

  const showInputForm = !isMobileView;

  useEffect(() => {
    if (isMobileView) {
      console.log("Mobile prompt data updated:", {
        displayedPrompts,
        promptQueue,
      });
    }
  }, [isMobileView, displayedPrompts, promptQueue]);

  return (
    <div
      className={`flex flex-col w-full ${isMobileView ? "w-full justify-end" : "md:w-[30%]"}`}
    >
      <div className="w-full py-3 px-2 hidden md:flex items-center justify-end gap-4">
        <TrackedButton
          className="px-4 py-2 h-10 rounded-lg bg-white text-black hover:bg-gray-100 flex items-center justify-center gap-2"
          onClick={handleJoinDiscordClick}
          trackingEvent="explore_header_join_discord_clicked"
          trackingProperties={{ location: "explore_header" }}
        >
          <DiscordLogoIcon className="h-4 w-4" />
          Join Discord
        </TrackedButton>

        <TrackedButton
          className="px-4 py-2 h-10 rounded-lg bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2"
          onClick={onTryCameraClick}
          trackingEvent="explore_header_start_creating_clicked"
          trackingProperties={{ location: "explore_header" }}
        >
          <Camera className="h-4 w-4" />
          {buttonText}
        </TrackedButton>
      </div>

      <div
        className={`w-full flex flex-col overflow-hidden ${isMobileView ? "max-h-[60vh]" : "h-full"} ${isMobileView ? "" : "md:h-[calc(100%-49px)]"} ${!isMobileView ? "fixed bottom-0 left-0 right-0 md:relative" : ""}`}
        style={{
          position: "relative",
          background: isMobileView
            ? "transparent"
            : "linear-gradient(180deg, #FFFFFF 0%, #B9D1DD 100%)",
          padding: isMobileView ? 0 : "1px",
          borderRadius: isMobileView ? 0 : "12px",
          ...(typeof window !== "undefined" &&
          window.innerWidth < 768 &&
          !isMobileView
            ? {
                background: "transparent",
                padding: 0,
              }
            : {}),
        }}
      >
        <div
          className="w-full h-full flex flex-col"
          style={{
            backgroundColor: isMobileView ? "transparent" : "#FBFBFB",
            borderRadius: isMobileView ? 0 : "12px",
            ...(typeof window !== "undefined" &&
            window.innerWidth < 768 &&
            !isMobileView
              ? {
                  backgroundColor: "transparent",
                }
              : {}),
          }}
        >
          {!isMobileView && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden pointer-events-none"></div>
          )}

          <div
            className={`flex flex-col h-full ${isMobileView ? "justify-end" : ""}`}
          >
            <div className="hidden md:flex justify-end items-center p-3 border-b border-gray-100"></div>

            <div
              className={`flex-1 flex flex-col justify-end overflow-hidden relative text-white md:text-inherit ${!isMobileView ? "mb-16 md:mb-0" : ""}`}
            >
              {!isMobileView && (
                <>
                  <div
                    className="absolute top-0 left-0 right-0 h-[60%] pointer-events-none z-30 md:block hidden"
                    style={{
                      background:
                        "linear-gradient(rgb(251, 251, 251) 0%, rgb(251, 251, 251) 3%, rgba(251, 251, 251, 0.9) 5%, rgba(251, 251, 251, 0.6) 38%, transparent 80%)",
                    }}
                  ></div>
                  <div
                    className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none z-20 md:block hidden"
                    style={{
                      background:
                        "linear-gradient(to bottom, var(--background, rgb(249, 250, 251)) 0%, var(--background, rgb(249, 250, 251)) 40%, var(--background, rgb(249, 250, 251)) 60%, rgba(249, 250, 251, 0.2) 80%, rgba(249, 250, 251, 0.05) 90%, rgba(249, 250, 251, 0) 100%)",
                    }}
                  ></div>
                  <div
                    className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none z-20 md:block hidden"
                    style={{
                      backdropFilter: "blur(2px)",
                      WebkitBackdropFilter: "blur(2px)",
                      maskImage:
                        "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.05) 90%, rgba(0,0,0,0) 100%)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.05) 90%, rgba(0,0,0,0) 100%)",
                    }}
                  ></div>
                </>
              )}

              {isMobileView && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent pointer-events-none"></div>
              )}

              <PromptDisplay
                promptQueue={promptQueue}
                displayedPrompts={displayedPrompts}
                promptAvatarSeeds={promptAvatarSeeds}
                userPromptIndices={userPromptIndices}
                onPastPromptClick={handlePastPromptClick}
              />
            </div>

            {showInputForm && (
              <div className="md:bg-white bg-transparent fixed bottom-0 left-0 right-0 md:static md:bottom-auto z-30">
                <PromptForm
                  onSubmit={onSubmit}
                  value={promptValue}
                  onChange={onPromptChange}
                  isThrottled={isThrottled}
                  throttleTimeLeft={throttleTimeLeft}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
