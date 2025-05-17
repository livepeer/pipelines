"use client";

import { useCommandSuggestions } from "@/hooks/useCommandSuggestions";
import useFullscreenStore from "@/hooks/useFullscreenStore";
import { usePromptStore } from "@/hooks/usePromptStore";
import { usePromptVersionStore } from "@/hooks/usePromptVersionStore";
import track from "@/lib/track";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { cn } from "@repo/design-system/lib/utils";
import {
  Brain,
  CircleDot,
  Expand,
  Loader2,
  SlidersHorizontal,
  WandSparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { useDreamshaperStore, useStreamUpdates } from "@/hooks/useDreamshaper";
import SettingsMenu from "./prompt-settings";
import { MAX_PROMPT_LENGTH, useValidateInput } from "./useValidateInput";
import { Separator } from "@repo/design-system/components/ui/separator";
import { usePrivy } from "@/hooks/usePrivy";
import useAI from "@/hooks/useAI";
import { ChatAssistant } from "@/components/assisted-prompting/chat-assistant";
import { generateAIPrompt } from "@/lib/groq";
import { useWorldTrends } from "@/hooks/useWorldTrends";

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
  const { aiModeEnabled, toggleAIMode } = useAI();
  const { trends, loading, error, refetch } = useWorldTrends();
  const { authenticated } = usePrivy();
  const [isChatAssistantOpen, setIsChatAssistantOpen] = useState(false);
  const [inputValue, setInputValue] = useState(lastSubmittedPrompt || "");
  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
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

  const restoreLastPrompt = useCallback(() => {
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
  }, [lastSubmittedPrompt, ref, setInputValue]);

  useEffect(() => {
    if (lastSubmittedPrompt) {
      restoreLastPrompt();
    }
  }, [lastSubmittedPrompt, restoreLastPrompt]);

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
          className="text-sm font-sans w-full h-full m-0 p-0 px-4 py-3 break-all leading-tight"
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            lineHeight: "1.25rem",
            paddingBottom: "2.5rem",
            paddingRight: "9rem",
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
      incrementPromptVersion();
    } else {
      console.error("No input value to submit");
    }
  };

  const generatePrompt = async () => {
    try {
      setIsLoading(true);
      setInputValue("Standby, thinking...");

      const pick4Random = <T,>(arr: T[]): T[] => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a.slice(0, 4);
      };

      const keywords = pick4Random(trends).map(t => t.trend);
      const aiPrompt = await generateAIPrompt({
        message: inputValue,
        keywords,
      });

      setInputValue(aiPrompt);
    } catch {
      setInputValue("Error generating prompt. Please try again.");
    } finally {
      setIsLoading(false);
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
        "relative mx-auto flex flex-col justify-center items-start gap-2 h-auto min-h-20 md:h-auto md:min-h-20 md:gap-2 mt-4 mb-2 dark:bg-[#1A1A1A] bg-[#fefefe] md:rounded-xl w-[calc(100%-2rem)] md:w-[calc(min(100%,800px))] border-2 border-muted-foreground/10 z-10",
        isFullscreen
          ? "fixed left-1/2 bottom-0 -translate-x-1/2 z-[10000] w-[600px] max-w-[calc(100%-2rem)] rounded-[100px]"
          : "rounded-[100px]",
        (profanity || exceedsMaxLength) && "dark:border-red-700 border-red-600",
        aiModeEnabled && !profanity && !exceedsMaxLength && "border-zinc-900",
      )}
    >
      <div className="flex-1 relative flex items-center w-full">
        <div
          className="relative w-full flex items-start overflow-hidden rounded-[10px]"
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
              "text-black w-full shadow-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm outline-none bg-transparent py-3 px-4 break-all font-sans",
              !inputValue && "text-muted-foreground/50",
            )}
            style={{
              resize: "none",
              color: "transparent",
              caretColor: "black",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflow: "hidden",
              lineHeight: "1.25rem",
              paddingBottom: "2.5rem",
              paddingRight: "9rem",
            }}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            placeholder={PROMPT_PLACEHOLDER}
          />

          {!inputValue && (
            <div
              className="opacity-0 select-none pointer-events-none absolute left-0 top-0 w-full"
              aria-hidden="true"
            >
              <div className="text-sm font-sans py-3 px-4 break-all whitespace-pre-wrap">
                {PROMPT_PLACEHOLDER}
              </div>
            </div>
          )}

          {/* Assisted toggle */}
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1A1A1A] w-full h-9 rounded-b-md">
            <label className="absolute bottom-1 left-3 cursor-pointer flex gap-1.5 items-center">
              <input
                type="checkbox"
                className="sr-only peer focus:ring-0 active:ring-0"
                checked={aiModeEnabled}
                onChange={toggleAIMode}
              />
              <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-zinc-800 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              <span className="text-gray-400 text-sm font-medium mr-1 flex gap-1.5 items-center">
                <Brain
                  size={16}
                  className={cn(
                    aiModeEnabled ? "text-gray-700" : "text-gray-400",
                  )}
                />
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="absolute top-4 right-3 flex items-center h-8">
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

            <Tooltip delayDuration={50}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full md:flex"
                  onClick={e => {
                    e.preventDefault();
                    if (aiModeEnabled) {
                      setIsChatAssistantOpen(true);
                    } else {
                      setSettingsOpened(!settingsOpened);
                    }
                  }}
                >
                  {aiModeEnabled ? (
                    <Expand className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-white text-black border border-gray-200 shadow-md dark:bg-zinc-900 dark:text-white dark:border-zinc-700"
              >
                {aiModeEnabled ? "Assistant" : "Adjustments"}
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mr-2" />

            <Tooltip delayDuration={50}>
              <TooltipTrigger asChild>
                <div className="relative inline-block">
                  <Button
                    disabled={
                      aiModeEnabled
                        ? isLoading
                        : updating ||
                          !inputValue ||
                          profanity ||
                          exceedsMaxLength
                    }
                    onClick={e => {
                      e.preventDefault();
                      if (aiModeEnabled) {
                        generatePrompt();
                      } else {
                        submitPrompt();
                      }
                    }}
                    className={cn(
                      "border-none items-center justify-center font-semibold text-xs bg-[#000000] flex",
                      "disabled:bg-[#000000] disabled:opacity-80",
                      "w-auto h-9 aspect-square rounded-md",
                    )}
                  >
                    {updating || isLoading ? (
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
                <span className="text-gray-400 dark:text-gray-500">
                  {" "}
                  {aiModeEnabled ? "Generate" : "Enter"}
                </span>
              </TooltipContent>
            </Tooltip>
          </div>
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

      {aiModeEnabled && (
        <ChatAssistant
          initialPrompt={inputValue}
          onSavePrompt={newPrompt => {
            setInputValue(newPrompt);
            setIsChatAssistantOpen(false);
          }}
          open={isChatAssistantOpen}
          onOpenChange={setIsChatAssistantOpen}
        />
      )}

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

      <p
        className={cn(
          aiModeEnabled ? "text-gray-600" : "text-gray-400",
          "absolute -bottom-6 left-0 mx-auto text-xs",
        )}
      >
        {aiModeEnabled ? "Assisted mode is on " : "Assisted mode is off"}
      </p>
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
