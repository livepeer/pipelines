import { TrackedButton } from "@/components/analytics/TrackedButton";
import { useMultiplayerStreamStore } from "@/components/home/VideoSection";
import {
  MAX_PROMPT_LENGTH,
  useValidateInput,
} from "@/components/welcome/featured/useValidateInput";
import useMobileStore from "@/hooks/useMobileStore";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { cn } from "@repo/design-system/lib/utils";
import { ArrowRight, Flame } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePromptQueue } from "./hooks/usePromptQueue";

const allTrendingPrompts = [
  {
    display: "Guybrush Threepwood",
    prompt:
      "guybrush threepwood ((flat color)) studio ghibli --creativity 0.4 --quality 2",
  },
  {
    display: "Studio Ghibli",
    prompt: "studio ghibli (watercolor) :: ((flat colors)) --quality 3",
  },
  {
    display: "Cyberpunk City",
    prompt:
      "cyberpunk cityscape with neon lights, futuristic architecture --quality 5",
  },
  {
    display: "Anime Style",
    prompt:
      "anime-style illustration, detailed line art, vibrant colors --quality 3",
  },
  {
    display: "Ink Art",
    prompt:
      "((ink illustration, clean linework, sharp contrast)) :: cyan, magenta --quality 5",
  },
  {
    display: "Polar Bear",
    prompt:
      "a sad white (polar bear) sitting in antarctica, front view --quality 5",
  },
];

export default function NewPromptPanel() {
  const { isMobile } = useMobileStore();
  const { currentStream } = useMultiplayerStreamStore();
  const [promptValue, setPromptValue] = useState("");

  const {
    currentPrompt,
    recentPrompts,
    isSubmitting,
    wsRef,
    getHighlightedIndex,
    submitPrompt,
    addRandomPrompt,
  } = usePromptQueue(currentStream?.streamKey);

  const trendingPrompts = useMemo(() => {
    const shuffled = [...allTrendingPrompts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, []);

  const handleTrendingPromptClick = (prompt: string) => {
    setPromptValue(prompt);
  };

  const handlePastPromptClick = (prompt: string) => {
    setPromptValue(prompt);
  };

  const displayPrompts = useMemo(() => {
    const prompts = [];

    if (recentPrompts.length > 0) {
      for (let i = recentPrompts.length - 1; i >= 0; i--) {
        const isCurrentPrompt =
          currentPrompt && recentPrompts[i].id === currentPrompt.prompt.id;

        prompts.push({
          type: isCurrentPrompt ? ("current" as const) : ("past" as const),
          prompt: recentPrompts[i],
          isHighlighted: isCurrentPrompt,
        });
      }
    }

    return prompts;
  }, [recentPrompts, currentPrompt]);

  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(
    navigator.userAgent,
  );

  if (!currentStream) {
    return null;
  }

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
      {/* Trending prompts section - desktop only */}
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
                  disabled={isSubmitting}
                >
                  <span className="truncate">{item.display}</span>
                </TrackedButton>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main panel */}
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
          {/* Gradient overlays - desktop only */}
          <div
            className="md:block hidden absolute top-0 left-0 right-0 h-[60%] pointer-events-none z-30"
            style={{
              background:
                "linear-gradient(rgb(251, 251, 251) 0%, rgba(251, 251, 251, 0.7) 3%, rgba(251, 251, 251, 0.5) 5%, rgba(251, 251, 251, 0.3) 38%, transparent 80%)",
            }}
          />
          <div
            className="md:block hidden absolute top-0 left-0 right-0 h-[50%] pointer-events-none z-20"
            style={{
              background:
                "linear-gradient(to bottom, rgba(206, 223, 228, 0.6) 0%, rgba(206, 223, 228, 0.5) 40%, rgba(206, 223, 228, 0.4) 60%, rgba(206, 223, 228, 0.2) 80%, rgba(254, 254, 254, 0.05) 90%, rgba(254, 254, 254, 0) 100%)",
            }}
          />
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
          />

          {/* Prompt Display - desktop only */}
          {!isMobile && (
            <div className="w-full flex flex-col justify-end p-4 pb-0 overflow-hidden relative">
              <div className="flex flex-col gap-2 relative z-10 w-full mb-4">
                {displayPrompts.map((item, index) => {
                  if (item.type === "past") {
                    return (
                      <div
                        key={`prompt-past-${item.prompt.id}`}
                        className="p-2 px-3 text-sm text-[#282828] font-light italic flex items-center rounded-xl w-full cursor-pointer hover:bg-black/5 hover:backdrop-blur-[1px]"
                        style={{
                          transition: "all 0.3s ease-out",
                          borderRadius: "12px",
                        }}
                        onClick={() => handlePastPromptClick(item.prompt.text)}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="truncate block w-full">
                            {item.prompt.text}
                          </span>
                        </div>
                      </div>
                    );
                  } else if (item.type === "current") {
                    return (
                      <div
                        key={`prompt-current-${item.prompt.id}`}
                        className="p-3 px-4 text-sm md:text-base text-white md:text-black font-bold flex items-center animate-fadeSlideIn relative alwaysAnimatedButton bg-white/90 rounded-xl w-full cursor-pointer hover:bg-white"
                        style={{
                          transition: "all 0.3s ease-out",
                          borderRadius: "12px",
                        }}
                        onClick={() => handlePastPromptClick(item.prompt.text)}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="truncate block w-full">
                            {item.prompt.text}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          {/* Mobile - show only current prompt if exists */}
          {isMobile && currentPrompt && (
            <div className="w-full flex flex-col justify-end px-4 pb-2">
              <div className="flex flex-col gap-1 relative z-10 w-full mb-2">
                <div className="text-xs text-gray-500">Current Prompt:</div>
                <div className="text-sm text-black">
                  {currentPrompt.prompt.content}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile trending prompts */}
        <div
          className={cn(
            "flex flex-row gap-2 overflow-x-auto mb-2 px-4",
            isMobile ? "flex" : "hidden",
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
              disabled={isSubmitting}
            >
              <span className="truncate">{item.display}</span>
            </TrackedButton>
          ))}
        </div>

        {/* Prompt Form */}
        <div
          className={cn(
            "pt-0 relative z-10 px-4",
            isMobile
              ? "px-0 bg-transparent py-1"
              : "pb-4 md:border-b border-t md:border-t-0 border-gray-200/30",
          )}
        >
          <PromptSubmissionForm
            onSubmitPrompt={submitPrompt}
            isSubmitting={isSubmitting}
            promptValue={promptValue}
            setPromptValue={setPromptValue}
            isMobile={isMobile}
          />
          {!isMobile && (
            <p className="text-sm italic text-gray-500 mt-4 text-center">
              Each prompt is applied for 5 seconds
            </p>
          )}
        </div>
      </div>

      <style jsx global>{`
        .alwaysAnimatedButton {
          border-radius: 12px !important;
        }
        .alwaysAnimatedButton::before {
          border-radius: 12px !important;
        }
        @keyframes fadeSlideIn {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeSlideIn {
          animation: fadeSlideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

function PromptSubmissionForm({
  onSubmitPrompt,
  isSubmitting,
  promptValue,
  setPromptValue,
  isMobile = false,
}: {
  onSubmitPrompt: (text: string) => Promise<boolean>;
  isSubmitting: boolean;
  promptValue: string;
  setPromptValue: (value: string) => void;
  isMobile?: boolean;
}) {
  const { profanity, exceedsMaxLength } = useValidateInput(promptValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (profanity || exceedsMaxLength || !promptValue.trim()) return;

    const success = await onSubmitPrompt(promptValue);
    if (success) {
      setPromptValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (
        !isSubmitting &&
        promptValue.trim() &&
        !profanity &&
        !exceedsMaxLength
      ) {
        e.currentTarget.form?.requestSubmit();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptValue(e.target.value);
  };

  const errorMsg = useMemo(() => {
    if (exceedsMaxLength) {
      return `Your prompt exceeds the maximum length of ${MAX_PROMPT_LENGTH} characters`;
    }
    if (profanity) {
      return "Please remove harmful words from your prompt";
    }
    return null;
  }, [profanity, exceedsMaxLength]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";

      const scrollHeight = textareaRef.current.scrollHeight;
      const minHeight = 56;
      const maxHeight = 150;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [promptValue, isMobile]);

  return (
    <form id="prompt-form" onSubmit={handleSubmit}>
      <div className="relative mx-4 md:mx-0">
        <Textarea
          ref={textareaRef}
          placeholder={
            isSubmitting ? `Wait...` : "Add your prompt to the queue..."
          }
          className={`w-full ${
            isMobile
              ? "text-black rounded-[18px] text-sm flex items-center py-5"
              : "md:bg-white/50 bg-white/80 border border-solid border-[#DFDEDE] py-5 rounded-[24px]"
          } focus:ring-0 focus:border-[#DFDEDE] focus:outline-none pl-[25px] pr-16 bg-[#F4F4F9]  text-foreground ${
            isSubmitting ? "opacity-50" : ""
          } ${
            isMobile ? "" : "shadow-[8px_12px_24px_0px_#0D131E26]"
          } resize-none overflow-hidden ${
            profanity || exceedsMaxLength ? "border-red-500" : ""
          }`}
          value={promptValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          rows={1}
          style={{
            height: isMobile ? "59px" : undefined,
            minHeight: isMobile ? "59px" : "56px",
            lineHeight: undefined,
            paddingTop: undefined,
          }}
        />

        <div
          className={`absolute right-4 ${isMobile ? "bottom-4" : "bottom-3"} flex items-center justify-center -mb-[2px]`}
        >
          <button
            type="submit"
            className={`bg-black text-white rounded-full ${isMobile ? "w-8 h-8" : "w-10 h-10"} flex items-center justify-center`}
            disabled={
              isSubmitting ||
              !promptValue.trim() ||
              profanity ||
              exceedsMaxLength
            }
          >
            <ArrowRight className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
          </button>
        </div>
      </div>
      {errorMsg && (
        <div
          className={`text-xs ${isMobile ? "text-red-400" : "text-red-600"} mt-2 text-center`}
        >
          {errorMsg}
        </div>
      )}
    </form>
  );
}
