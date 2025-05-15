import React, { RefObject } from "react";
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
  onTryCameraClick,
  buttonText = "Pick your own video",
  isAuthenticated = false,
  promptFormRef,
  isMobile = false,
}: PromptPanelProps) {
  const handlePastPromptClick = (prompt: string) => {
    setPromptValue(prompt);
  };

  const handleJoinDiscordClick = () => {
    window.open("https://discord.gg/5sZu8xmn6U", "_blank");
  };

  // Calculate the height of the input container on mobile (approximately 76px)
  // 44px input height + 2 * 16px padding (p-4) = 76px
  const inputBoxHeight = 76;
  const bottomPosition = 56; // Footer height
  const marginBottom = 15; // Margin between prompt panel and input box
  const promptPanelBottom = bottomPosition + inputBoxHeight + marginBottom;

  return (
    <div
      className={`
      ${
        isMobile
          ? "absolute bottom-0 left-0 right-0 z-50"
          : "flex flex-col w-full md:w-[30%]"
      }
    `}
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

      {isMobile && (
        <div
          className="fixed left-0 right-0 max-h-[35vh] z-50 overflow-hidden bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-6 pt-12"
          style={{ bottom: `${promptPanelBottom}px` }}
        >
          <PromptDisplay
            promptQueue={promptQueue}
            displayedPrompts={displayedPrompts}
            promptAvatarSeeds={promptAvatarSeeds}
            userPromptIndices={userPromptIndices}
            onPastPromptClick={handlePastPromptClick}
            isMobile={isMobile}
          />
        </div>
      )}

      <div
        className={`
          ${
            isMobile
              ? "w-full flex flex-col overflow-hidden fixed bottom-[56px] left-0 right-0"
              : "w-full flex flex-col overflow-hidden h-full md:h-[calc(100%-49px)] fixed bottom-0 left-0 right-0 md:relative"
          }
        `}
        style={{
          position: isMobile ? "fixed" : "relative",
          background: isMobile
            ? "transparent"
            : "linear-gradient(180deg, #FFFFFF 0%, #B9D1DD 100%)",
          padding: isMobile ? "0" : "1px",
          borderRadius: isMobile ? "0" : "12px",
        }}
      >
        <div
          className={`
            ${isMobile ? "w-full" : "w-full h-full flex flex-col"}
          `}
          style={{
            backgroundColor: isMobile ? "transparent" : "#FBFBFB",
            borderRadius: isMobile ? "0" : "12px",
          }}
        >
          <div
            className={`
            ${
              isMobile
                ? "absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none"
                : "absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden pointer-events-none"
            }
          `}
          ></div>

          <div className="flex flex-col h-full justify-between">
            {!isMobile && (
              <div className="flex justify-end items-center p-3 border-b border-gray-100 md:hidden">
                <ActionButton
                  trackingEvent="explore_header_join_discord_clicked"
                  trackingProperties={{ location: "explore_mobile_header" }}
                  onClick={handleJoinDiscordClick}
                  icon={<DiscordLogoIcon className="h-4 w-4" />}
                >
                  <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm whitespace-nowrap overflow-hidden">
                    Join Discord
                  </span>
                </ActionButton>
                <div className="mx-2"></div>
                <ActionButton
                  trackingEvent="explore_header_start_creating_clicked"
                  trackingProperties={{ location: "explore_header" }}
                  onClick={onTryCameraClick}
                  icon={<Camera className="h-4 w-4" />}
                >
                  <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm whitespace-nowrap overflow-hidden">
                    {buttonText === "Pick your own video" ? (
                      <span className="inline xs:hidden">Try camera</span>
                    ) : (
                      buttonText
                    )}
                  </span>
                </ActionButton>
              </div>
            )}

            {!isMobile && (
              <div className="flex-1 flex flex-col justify-end overflow-hidden relative">
                <>
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
                </>
              </div>
            )}

            <div
              className={`${isMobile ? "fixed bottom-[56px] left-0 right-0 p-4 z-40 bg-black" : ""}`}
            >
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
        </div>
      </div>
    </div>
  );
}
