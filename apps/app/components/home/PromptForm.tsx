import React, {
  useRef,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
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
  isMobile?: boolean;
}

export const PromptForm = forwardRef<HTMLFormElement, PromptFormProps>(
  function PromptForm(
    {
      onSubmit,
      value,
      onChange,
      isThrottled,
      throttleTimeLeft,
      disabled = false,
      isMobile = false,
    },
    ref,
  ) {
    const { profanity, exceedsMaxLength } = useValidateInput(value);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    useImperativeHandle(ref, () => {
      if (!formRef.current) {
        throw new Error("Form ref is not available");
      }
      return formRef.current;
    });

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

        if (isMobile) {
          textareaRef.current.style.height = "44px";
          return;
        }

        const scrollHeight = textareaRef.current.scrollHeight;
        const minHeight = 56;
        const maxHeight = 150;
        const newHeight = Math.min(
          Math.max(scrollHeight, minHeight),
          maxHeight,
        );
        textareaRef.current.style.height = `${newHeight}px`;
      }
    }, [value, isMobile]);

    return (
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`pt-0 ${isMobile ? "px-0" : "px-4"} pb-4 ${isMobile ? "" : "md:border-b border-t md:border-t-0 border-gray-200/30"} relative z-10`}
      >
        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder={
              isThrottled
                ? `Wait ${throttleTimeLeft}s...`
                : "Add your prompt to the queue..."
            }
            className={`w-full ${
              isMobile
                ? "bg-white text-black border-0 py-3 rounded-[18px] text-sm flex items-center"
                : "md:bg-white/50 bg-white/80 border border-solid border-[#DFDEDE] py-5 rounded-[24px]"
            } focus:ring-0 focus:border-[#DFDEDE] focus:outline-none pl-[25px] pr-16 ${
              isThrottled ? "opacity-50" : ""
            } ${
              isMobile ? "" : "shadow-[8px_12px_24px_0px_#0D131E26]"
            } resize-none overflow-hidden ${
              profanity || exceedsMaxLength ? "border-red-500" : ""
            }`}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            disabled={isThrottled || disabled}
            rows={1}
            style={{
              height: isMobile ? "44px" : undefined,
              minHeight: isMobile ? "44px" : "56px",
              lineHeight: isMobile ? "1" : undefined,
              paddingTop: isMobile && !value ? "14px" : undefined,
            }}
          />

          <div
            className={`absolute right-4 ${isMobile ? "bottom-2" : "bottom-3"} flex items-center justify-center -mb-[2px]`}
          >
            <button
              type="submit"
              className={`bg-black text-white rounded-full ${isMobile ? "w-8 h-8" : "w-10 h-10"} flex items-center justify-center`}
              disabled={
                isThrottled ||
                disabled ||
                !value.trim() ||
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
        {!isMobile && (
          <p className="text-sm italic text-gray-500 mt-4 text-center">
            Each prompt is applied for 5 seconds
          </p>
        )}
      </form>
    );
  },
);
