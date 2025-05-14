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

type CommandOption = {
  id: string;
  label: string;
  type: string;
  description: string;
};

type PipelineParam = {
  name: string;
  description?: string;
  widget?: string;
};

interface InputPromptProps {
  onPromptSubmit?: () => void;
}

export const InputPrompt = ({ onPromptSubmit }: InputPromptProps) => {
  const { pipeline, stream, updating } = useDreamshaperStore();
  const { handleStreamUpdate } = useStreamUpdates();
  const { isFullscreen } = useFullscreenStore();
  const { lastSubmittedPrompt, setLastSubmittedPrompt, setHasSubmittedPrompt } =
    usePromptStore();
  const { promptVersion, incrementPromptVersion } = usePromptVersionStore();

  const { authenticated } = usePrivy();
  const { promptCount } = useGuestUserStore();

  const [inputValue, setInputValue] = useState("");
  const [isInputHovered, setInputHovered] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

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
    inputRef: ref as React.RefObject<HTMLTextAreaElement>,
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
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="text-sm font-sans w-full h-full m-0 p-0 pl-3 py-3 break-all leading-tight"
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            lineHeight: "1.25rem",
          }}
        >
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
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (ref && typeof ref !== "function" && ref.current) {
      ref.current.focus();
    }
  }, []);

  const submitPrompt = () => {
    if (inputValue) {
      if (onPromptSubmit && onPromptSubmit()) {
        return;
      }

      track("daydream_prompt_submitted", {
        is_authenticated: authenticated,
        prompt: inputValue,
        stream_id: stream?.id,
      });

      handleStreamUpdate(inputValue, { silent: true });
      setLastSubmittedPrompt(inputValue);
      setHasSubmittedPrompt(true);
      setInputValue("");
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

  const getHeight = () => {
    if (!lastSubmittedPrompt) return 44;
    const lineCount = (lastSubmittedPrompt.match(/\n/g) || []).length + 1;
    if (lineCount > 3) return 120;
    if (lineCount > 2) return 90;
    if (lineCount > 1) return 66;
    return 44;
  };

  const currentHeight = getHeight();

  return (
    <div
      className={cn(
        "relative mx-auto flex justify-center items-start gap-2 h-auto min-h-14 md:h-auto md:min-h-14 md:gap-2 mt-4 mb-2 dark:bg-[#1A1A1A] bg-[#fefefe] md:rounded-xl py-2.5 px-3 md:py-1.5 md:px-3 w-[calc(100%-2rem)] md:w-[calc(min(100%,800px))] border-2 border-muted-foreground/10",
        isFullscreen
          ? "fixed left-1/2 bottom-0 -translate-x-1/2 z-[10000] w-[600px] max-w-[calc(100%-2rem)] rounded-[100px]"
          : "rounded-[100px]",
        (profanity || exceedsMaxLength) && "dark:border-red-700 border-red-600",
      )}
    >
      <div
        className="flex-1 relative flex items-center"
        onMouseEnter={() => setInputHovered(true)}
        onMouseLeave={() => setInputHovered(false)}
      >
        <div
          className="relative w-full flex items-start overflow-hidden"
          style={{
            minHeight: `${currentHeight}px`,
          }}
          onClick={() => ref.current?.focus()}
        >
          {inputValue && formatInputWithHighlights()}

          <TextareaAutosize
            ref={ref}
            minRows={1}
            maxRows={5}
            className={cn(
              "text-black w-full shadow-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm outline-none bg-transparent py-3 break-all font-sans pl-3",
              !inputValue && "text-muted-foreground/50",
            )}
            style={{
              resize: "none",
              color: inputValue ? "black" : "transparent",
              caretColor: "black",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflow: "hidden",
              lineHeight: "1.25rem",
            }}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            placeholder={lastSubmittedPrompt || PROMPT_PLACEHOLDER}
          />

          {!inputValue && (
            <div
              className="opacity-0 select-none pointer-events-none absolute left-0 top-0 w-full"
              aria-hidden="true"
            >
              <div className="text-sm font-sans py-3 pl-3 break-all whitespace-pre-wrap">
                {lastSubmittedPrompt || PROMPT_PLACEHOLDER}
              </div>
            </div>
          )}
        </div>

        {commandMenuOpen && filteredOptions.length > 0 && (
          <div
            className="absolute z-[51] bottom-full mb-2 w-60 bg-popover rounded-md border shadow-md"
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

      <div className="flex items-center self-stretch">
        {inputValue ? (
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
        ) : lastSubmittedPrompt ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={e => {
                  e.stopPropagation();
                  restoreLastPrompt();
                }}
                aria-label="Restore last prompt"
              >
                <span className="text-muted-foreground text-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={5}
              className="bg-white text-black border border-gray-200 shadow-md dark:bg-zinc-900 dark:text-white dark:border-zinc-700"
            >
              Edit prompt
            </TooltipContent>
          </Tooltip>
        ) : null}

        <div className="relative">
          <Tooltip delayDuration={50}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full md:flex"
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

        <Separator orientation="vertical" className="h-6 mr-2" />

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
                  "w-auto h-9 aspect-square rounded-md",
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
            Prompt{" "}
            <span className="text-gray-400 dark:text-gray-500">Enter</span>
          </TooltipContent>
        </Tooltip>
      </div>

      {(profanity || exceedsMaxLength) && (
        <div className="absolute -top-10 left-0 mx-auto flex items-center justify-center gap-4 text-xs text-muted-foreground mt-4">
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
