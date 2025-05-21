import React, { useMemo } from "react";
import type { MultiplayerPrompt } from "@/hooks/usePromptsApi";
import { cn } from "@repo/design-system/lib/utils";
interface PromptDisplayProps {
  prompts: MultiplayerPrompt[];
  activeIndex: string;
  onPastPromptClick: (prompt: string) => void;
  isMobile: boolean;
}

const MAX_MOBILE_PROMPTS = 4;
export const PromptDisplay = React.memo(
  ({
    prompts,
    activeIndex,
    onPastPromptClick,
    isMobile = false,
  }: PromptDisplayProps) => {
    if (isMobile) {
      return (
        <div className="w-full flex flex-col justify-end p-4 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col gap-2 w-full justify-end">
            {prompts.slice(-MAX_MOBILE_PROMPTS).map(item => {
              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-2 px-3 text-sm rounded-xl w-full font-medium cursor-pointer transition-all duration-300 ease-out",
                    item.id === activeIndex
                      ? "text-white font-bold border border-white/90 backdrop-blur-sm"
                      : "text-white/80 italic",
                  )}
                  onClick={() => onPastPromptClick?.(item.content)}
                >
                  <div className="min-w-0 flex-1">
                    <span className="truncate block w-full">
                      {item.content}
                    </span>
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
          {prompts.length > 0 && (
            <div className="flex flex-col gap-2 w-full">
              {prompts.map(item => {
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "p-2 px-3 text-sm md:text-base text-gray-500 italic flex items-center rounded-xl w-full cursor-pointer hover:bg-black/5 hover:backdrop-blur-[1px] font-medium transition-all duration-300 ease-out",
                      item.id === activeIndex &&
                        "p-3 px-4 text-sm md:text-base text-white md:text-black font-bold flex items-center animate-fadeSlideIn relative alwaysAnimatedButton bg-white/90 rounded-xl w-full",
                    )}
                    onClick={() => onPastPromptClick?.(item.content)}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="truncate block w-full">
                        {item.content}
                      </span>
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
  },
  (prevProps, nextProps) => {
    return (
      prevProps.prompts === nextProps.prompts &&
      prevProps.activeIndex === nextProps.activeIndex
    );
  },
);
PromptDisplay.displayName = "PromptDisplay";
