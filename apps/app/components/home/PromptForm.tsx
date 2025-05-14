import React, { useRef, useEffect, useMemo } from "react";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { ArrowRight } from "lucide-react";
import {
  useValidateInput,
  MAX_PROMPT_LENGTH,
} from "@/components/welcome/featured/useValidateInput";

interface PromptFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isThrottled: boolean;
  throttleTimeLeft: number;
  disabled?: boolean;
}

export function PromptForm({
  onSubmit,
  value,
  onChange,
  isThrottled,
  throttleTimeLeft,
  disabled = false,
}: PromptFormProps) {
  const { profanity, exceedsMaxLength } = useValidateInput(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (profanity || exceedsMaxLength) return;
    onSubmit(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (
        !isThrottled &&
        !disabled &&
        value.trim() &&
        !profanity &&
        !exceedsMaxLength
      ) {
        formRef.current?.requestSubmit();
      }
    }
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
  }, [value]);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="pt-0 px-4 pb-4 md:border-b border-t md:border-t-0 border-gray-200/30 relative z-10"
    >
      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder={
            isThrottled
              ? `Wait ${throttleTimeLeft}s...`
              : "Add your prompt to the queue..."
          }
          className={`w-full md:bg-white/50 bg-white/80 rounded-[24px] border border-solid border-[#DFDEDE] focus:ring-0 focus:border-[#DFDEDE] focus:outline-none pl-[25px] py-5 pr-16 ${isThrottled ? "opacity-50" : ""} shadow-[8px_12px_24px_0px_#0D131E26] resize-none overflow-hidden ${profanity || exceedsMaxLength ? "border-red-500" : ""}`}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          disabled={isThrottled || disabled}
          rows={1}
          style={{ minHeight: "56px" }}
        />

        <div className="absolute right-4 bottom-3 flex items-center justify-center -mb-[2px]">
          <button
            type="submit"
            className="bg-black text-white rounded-full w-10 h-10 flex items-center justify-center"
            disabled={
              isThrottled ||
              disabled ||
              !value.trim() ||
              profanity ||
              exceedsMaxLength
            }
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      {errorMsg && (
        <div className="text-xs text-red-600 mt-2 text-center">{errorMsg}</div>
      )}
    </form>
  );
}
