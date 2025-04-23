"use client";

import { useCommandSuggestions } from "@/hooks/useCommandSuggestions";
import useFullscreenStore from "@/hooks/useFullscreenStore";
import useMobileStore from "@/hooks/useMobileStore";
import { usePromptStore } from "@/hooks/usePromptStore";
import { usePromptVersionStore } from "@/hooks/usePromptVersionStore";
import track from "@/lib/track";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { cn } from "@repo/design-system/lib/utils";
import {
  CircleDot,
  Loader2,
  SlidersHorizontal,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import {
  useDreamshaperStore,
  useStreamUpdates,
} from "../../../hooks/useDreamshaper";
import SettingsMenu from "./prompt-settings";
import { MAX_PROMPT_LENGTH, useValidateInput } from "./useValidateInput";
import { Separator } from "@repo/design-system/components/ui/separator";
import { usePrivy } from "@/hooks/usePrivy";
import { useGuestUserStore } from "@/hooks/useGuestUser";

const PROMPT_PLACEHOLDER = "Enter your prompt...";

// Define type for command options
type CommandOption = {
  id: string;
  label: string;
  type: string;
  description: string;
};

// Define type for pipeline parameters
type PipelineParam = {
  name: string;
  description?: string;
  widget?: string;
  // Add other fields if needed
};

interface InputPromptProps {
  onPromptSubmit?: () => void;
}

export const InputPrompt = ({ onPromptSubmit }: InputPromptProps) => {
  const { pipeline, stream, updating } = useDreamshaperStore();
  const { handleStreamUpdate } = useStreamUpdates();
  const { isFullscreen } = useFullscreenStore();
  const { isMobile } = useMobileStore();
  const { lastSubmittedPrompt, setLastSubmittedPrompt, setHasSubmittedPrompt } =
    usePromptStore();
  const { promptVersion, incrementPromptVersion } = usePromptVersionStore();

  const { authenticated } = usePrivy();
  const { promptCount } = useGuestUserStore();

  const [inputValue, setInputValue] = useState("");
  const [isInputHovered, setInputHovered] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>();

  const { profanity, exceedsMaxLength } = useValidateInput(inputValue);

  const commandOptions = useMemo<CommandOption[]>(() => {
    if (!pipeline?.prioritized_params) return [];

    return pipeline.prioritized_params.map((param: PipelineParam) => ({
      id: param.name.toLowerCase().replace(/\s+/g, "-"),
      label: param.name,
      type: param.widget || "string",
      description: param.description || param.name,
    }));
  }, [pipeline?.prioritized_params]);

  const restoreLastPrompt = () => {
    if (lastSubmittedPrompt) {
      setInputValue(lastSubmittedPrompt);
      setTimeout(() => {
        if (ref && typeof ref !== "function" && ref.current) {
          ref.current.focus();

          if ("setSelectionRange" in ref.current) {
            const length = lastSubmittedPrompt.length;
            ref.current.setSelectionRange(length, length);
          }
        }
      }, 0);
    }
  };

  const {
    commandMenuOpen,
    filteredOptions,
    handleSelectOption,
    handleKeyDown: handleCommandKeyDown,
    caretRef,
    selectedOptionIndex,
  } = useCommandSuggestions({
    options: commandOptions,
    inputValue,
    setInputValue,
    inputRef: ref as React.RefObject<HTMLInputElement | HTMLTextAreaElement>,
  });

  const formatInputWithHighlights = () => {
    if (!inputValue) return null;

    const commandRegex = /--([a-zA-Z0-9_-]+)(?:\s+(?:"([^"]*)"|([\S]*)))/g;

    const parts = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = commandRegex.exec(inputValue)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          text: inputValue.substring(lastIndex, match.index),
          isCommand: false,
          isValue: false,
        });
      }

      const commandName = `--${match![1]}`;
      const isValidCommand = commandOptions.some(
        option => option.id === match![1],
      );

      parts.push({
        text: commandName,
        isCommand: true,
        isValid: isValidCommand,
        isValue: false,
      });

      parts.push({
        text: " ",
        isCommand: false,
        isValue: false,
      });

      const value =
        match![2] !== undefined ? `"${match![2]}"` : match![3] || "";
      parts.push({
        text: value,
        isCommand: false,
        isValue: true,
        isValidCommand: isValidCommand,
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < inputValue.length) {
      parts.push({
        text: inputValue.substring(lastIndex),
        isCommand: false,
        isValue: false,
      });
    }

    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <pre className="text-sm font-sans whitespace-pre-wrap overflow-hidden w-full m-0 p-0 pl-3">
          {parts.map((part, i) => (
            <span
              key={i}
              className={
                part.isCommand && part.isValid
                  ? "text-green-500"
                  : part.isValue && part.isValidCommand
                    ? "text-foreground"
                    : ""
              }
              style={{
                ...((part.isCommand && part.isValid) ||
                (part.isValue && part.isValidCommand)
                  ? {
                      textShadow:
                        "0 0 0.8px currentColor, 0 0 0.8px currentColor",
                    }
                  : {}),
              }}
            >
              {part.text}
            </span>
          ))}
        </pre>
      </div>
    );
  };

  useEffect(() => {
    if (!isMobile) {
      if (ref && typeof ref !== "function" && ref.current) {
        ref.current.focus();
      }
    }
  }, [isMobile]);

  const submitPrompt = () => {
    if (inputValue) {
      if (isMobile && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      if (onPromptSubmit && onPromptSubmit()) {
        return;
      }

      track("daydream_prompt_submitted", {
        is_authenticated: authenticated,
        prompt: inputValue,
        stream_id: stream?.id,
      });

      handleStreamUpdate(inputValue, { silent: true });
      setLastSubmittedPrompt(inputValue); // Store the submitted prompt
      setHasSubmittedPrompt(true);
      setInputValue("");
      incrementPromptVersion(promptVersion + 1);
    } else {
      console.error("No input value to submit");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (commandMenuOpen) {
      handleCommandKeyDown(e);
      return;
    }

    if (e.key === "ArrowUp" && !inputValue && lastSubmittedPrompt) {
      e.preventDefault();
      restoreLastPrompt();
      return;
    }

    if (
      !updating &&
      !profanity &&
      !exceedsMaxLength &&
      e.key === "Enter" &&
      !(e.metaKey || e.ctrlKey || e.shiftKey)
    ) {
      e.preventDefault();
      submitPrompt();
    }
  };

  return (
    <div
      className={cn(
        "relative mx-auto flex justify-center items-center gap-2 h-14 md:h-auto md:min-h-14 md:gap-2 mt-4 mb-2 dark:bg-[#1A1A1A] bg-[#fefefe] md:rounded-xl py-2.5 px-3 md:py-1.5 md:px-3 w-[calc(100%-2rem)] md:w-[calc(min(100%,800px))] border-2 border-muted-foreground/10",
        isFullscreen
          ? isMobile
            ? "fixed left-1/2 bottom-[calc(env(safe-area-inset-bottom)+16px)] -translate-x-1/2 z-[10000] w-[600px] max-w-[calc(100%-2rem)] max-h-16 rounded-2xl"
            : "fixed left-1/2 bottom-0 -translate-x-1/2 z-[10000] w-[600px] max-w-[calc(100%-2rem)] max-h-16 rounded-[100px]"
          : isMobile
            ? "rounded-2xl shadow-[4px_12px_16px_0px_#37373F40]"
            : "rounded-[100px]",
        (profanity || exceedsMaxLength) && "dark:border-red-700 border-red-600",
      )}
    >
      <div
        className="flex-1 relative flex items-center"
        onMouseEnter={() => setInputHovered(true)}
        onMouseLeave={() => setInputHovered(false)}
      >
        {!inputValue && (
          <div
            key={lastSubmittedPrompt}
            className={cn(
              "absolute inset-y-0 left-3 md:left-3 flex items-center text-muted-foreground/50 text-xs w-full z-10",
              isInputHovered ? "pointer-events-auto" : "pointer-events-none",
            )}
            onClick={e => {
              if ((e.target as HTMLElement).closest("button")) {
                return;
              }
              if (ref.current) {
                ref.current.focus();
              }
            }}
          >
            <span>{lastSubmittedPrompt || PROMPT_PLACEHOLDER}</span>
            {isInputHovered && lastSubmittedPrompt && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      restoreLastPrompt();
                    }}
                    className="ml-2 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center relative z-20"
                    aria-label="Restore last prompt"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5"
                    >
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  sideOffset={5}
                  className="bg-white text-black border border-gray-200 shadow-md dark:bg-zinc-900 dark:text-white dark:border-zinc-700"
                >
                  Edit prompt
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Input wrapper with highlighting */}
        <div
          className="relative w-full flex items-center"
          style={{ height: "auto" }}
        >
          {formatInputWithHighlights()}
          {isMobile ? (
            <Input
              ref={ref as React.RefObject<HTMLInputElement>}
              className="w-full shadow-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm outline-none bg-transparent py-3 font-sans"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onFocus={() => {
                window.scrollTo({
                  top: document.body.scrollHeight,
                  behavior: "smooth",
                });
              }}
              onKeyDown={handleKeyDown}
              style={{
                color: "transparent",
                caretColor: "black",
                paddingLeft: "12px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            />
          ) : (
            <TextareaAutosize
              ref={ref as React.RefObject<HTMLTextAreaElement>}
              minRows={1}
              maxRows={5}
              className="text-black w-full shadow-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm outline-none bg-transparent py-3 break-all font-sans pl-3"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                resize: "none",
                color: "transparent",
                caretColor: "black",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            />
          )}
        </div>

        {/* Command menu popover - Positioned ABOVE the input */}
        {commandMenuOpen && filteredOptions.length > 0 && (
          <div
            className="absolute z-50 bottom-full mb-2 w-60 bg-popover rounded-md border shadow-md"
            style={{
              left: caretRef.current?.left ?? 0,
            }}
          >
            <div className="p-1">
              {filteredOptions.map((option, index) => (
                <button
                  key={option.id}
                  className={`flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm ${
                    index === selectedOptionIndex
                      ? "bg-accent"
                      : "hover:bg-accent"
                  } focus:outline-none`}
                  onClick={() => handleSelectOption(option)}
                >
                  <div className="flex flex-col">
                    <div className="font-medium flex items-center">
                      <span>--{option.id}</span>
                      {option.type && (
                        <span className="ml-1.5 text-muted-foreground opacity-70 text-xs">
                          {option.type}
                        </span>
                      )}
                    </div>
                    {option.description && (
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {inputValue && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={e => {
            e.preventDefault();
            setInputValue("");
          }}
        >
          <span className="text-muted-foreground text-lg">×</span>
        </Button>
      )}

      {/* Settings button */}
      {!isMobile && (
        <div className="relative">
          <Tooltip delayDuration={50}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hidden md:flex"
                onClick={e => {
                  e.preventDefault();
                  setSettingsOpened(!settingsOpened);
                }}
              >
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-white text-black border border-gray-200 shadow-md dark:bg-zinc-900 dark:text-white dark:border-zinc-700"
            >
              Adjustments
            </TooltipContent>
          </Tooltip>

          {settingsOpened && (
            <SettingsMenu
              pipeline={pipeline}
              inputValue={inputValue}
              setInputValue={setInputValue}
              onClose={() => setSettingsOpened(false)}
              onSubmit={submitPrompt}
              originalPrompt={lastSubmittedPrompt || undefined}
            />
          )}
        </div>
      )}

      {!isMobile && <Separator orientation="vertical" className="h-6 mr-2" />}

      <Tooltip delayDuration={50}>
        <TooltipTrigger asChild>
          <div className="relative inline-block">
            <Button
              disabled={
                updating || !inputValue || profanity || exceedsMaxLength
              }
              onClick={e => {
                e.preventDefault();
                submitPrompt();
              }}
              className={cn(
                "border-none items-center justify-center font-semibold text-xs bg-[#000000] flex disabled:bg-[#000000] disabled:opacity-80",
                isMobile
                  ? "w-auto h-9 aspect-square rounded-md"
                  : "w-auto h-9 aspect-square rounded-md",
              )}
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <WandSparkles className="h-4 w-4 stroke-[2]" />
              )}
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-white text-black border border-gray-200 shadow-md dark:bg-zinc-900 dark:text-white dark:border-zinc-700"
        >
          Prompt <span className="text-gray-400 dark:text-gray-500">Enter</span>
        </TooltipContent>
      </Tooltip>

      {(profanity || exceedsMaxLength) && (
        <div
          className={cn(
            "absolute -top-10 left-0 mx-auto flex items-center justify-center gap-4 text-xs text-muted-foreground mt-4",
            isMobile && "-top-8 text-[9px] left-auto",
          )}
        >
          {exceedsMaxLength ? (
            <span className="text-red-600">
              {`Please fix your prompt as it exceeds the maximum length of ${MAX_PROMPT_LENGTH} characters`}
            </span>
          ) : (
            <span className="text-red-600">
              Please fix your prompt as it may contain harmful words
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const ClipRecordButton = () => {
  return (
    <div className="rounded-full bg-gradient-to-r from-[#BCBCBC] via-[#1BB6FF] to-[#767676] p-[1px]">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "w-full px-3 h-8 rounded-full bg-white border-none",
          "flex items-center gap-2",
        )}
        onClick={e => {
          e.preventDefault();
        }}
      >
        <CircleDot className="px-[0.5px] text-muted-foreground" />
        <span className="text-[0.65rem] text-muted-foreground">
          Record a clip
        </span>
      </Button>
    </div>
  );
};
