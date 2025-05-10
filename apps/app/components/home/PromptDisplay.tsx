import React from "react";
import { ArrowLeft, Sparkle } from "lucide-react";
import { GradientAvatar } from "@/components/GradientAvatar";

interface PromptItem {
  text: string;
  seed: string;
  isUser: boolean;
}

interface PromptDisplayProps {
  promptQueue: PromptItem[];
  displayedPrompts: string[];
  promptAvatarSeeds: string[];
  userPromptIndices: boolean[];
}

export function PromptDisplay({
  promptQueue,
  displayedPrompts,
  promptAvatarSeeds,
  userPromptIndices,
}: PromptDisplayProps) {
  return (
    <div className="flex-1 max-h-[25vh] md:max-h-none p-4 flex flex-col md:justify-start justify-end overflow-hidden order-first md:order-none relative z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 md:hidden pointer-events-none z-0"></div>
      <div className="space-y-0.5 flex flex-col-reverse md:flex-col relative z-10">
        {promptQueue.length > 0 && (
          <div className="hidden md:flex flex-col gap-0.5 mb-1">
            {[...promptQueue].reverse().map((queuedPrompt, qIndex) => {
              const queuePosition = promptQueue.length - qIndex - 1;
              const queueOpacity = Math.max(0.4, 1 - queuePosition * 0.15);
              const queueScale = Math.max(0.94, 1 - queuePosition * 0.015);

              return (
                <div
                  key={`queue-${qIndex}-${queuedPrompt.text.substring(0, 10)}`}
                  className={`p-2 rounded-lg text-gray-500 italic flex items-center text-sm md:text-base ${
                    queuedPrompt.isUser ? "bg-black/5 backdrop-blur-[1px]" : ""
                  }`}
                  style={{
                    animation: "slideDown 0.3s ease-out",
                    fontFamily: "'Courier New', Courier, monospace",
                    opacity: queueOpacity,
                    transform: `scale(${queueScale})`,
                    transformOrigin: "left center",
                  }}
                >
                  <div className="mr-2 flex-shrink-0">
                    <GradientAvatar seed={queuedPrompt.seed} size={16} />
                  </div>
                  <span className="truncate">{queuedPrompt.text}</span>
                </div>
              );
            })}
          </div>
        )}

        {displayedPrompts.map((prevPrompt, index) => {
          let itemOpacity = index === 0 ? 1 : Math.max(0.3, 1 - index * 0.15);

          const itemScale = index === 0 ? 1 : Math.max(0.94, 1 - index * 0.015);

          const isUserPrompt = userPromptIndices[index];

          return (
            <div
              key={`prompt-${index}-${prevPrompt.substring(0, 10)}`}
              className={`p-2 rounded-lg text-sm md:text-base ${
                index === 0
                  ? "text-white md:text-black font-bold flex items-center animate-fadeSlideIn md:bg-white/30 md:backdrop-blur-[2px] md:shadow-sm"
                  : `text-gray-500 italic flex items-center ${
                      isUserPrompt
                        ? "font-medium md:bg-black/5 md:backdrop-blur-[1px]"
                        : ""
                    } ${index !== 0 ? "mobile-slide-up" : ""}`
              } ${isUserPrompt && index !== 0 ? "relative overflow-hidden" : ""} mobile-fade-${index}`}
              style={{
                opacity: itemOpacity,
                transition: "all 0.3s ease-out",
                transform:
                  index === 0
                    ? `translateY(0)`
                    : `translateY(0) scale(${itemScale})`,
                transformOrigin: "left center",
                animation:
                  index === 0
                    ? "fadeSlideIn 0.3s ease-out"
                    : `slideDown 0.3s ease-out`,
                fontFamily: "'Courier New', Courier, monospace",
              }}
            >
              {isUserPrompt && index !== 0 && (
                <div
                  className="absolute inset-0 -z-10 bg-black/5 backdrop-blur-[1px] rounded-lg md:hidden"
                  style={{ opacity: Math.min(1, itemOpacity + 0.2) }}
                ></div>
              )}
              {index === 0 ? (
                <>
                  <ArrowLeft className="hidden md:hidden h-3 w-3 mr-2 stroke-2 flex-shrink-0" />
                  <Sparkle className="md:inline h-4 w-4 mr-2 stroke-2 flex-shrink-0" />
                </>
              ) : (
                <div
                  className="mr-2 flex-shrink-0"
                  style={{ opacity: itemOpacity }}
                >
                  <GradientAvatar seed={promptAvatarSeeds[index]} size={16} />
                </div>
              )}
              <span className="truncate">{prevPrompt}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
