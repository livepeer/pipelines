import React, { useMemo } from "react";
import { Input } from "@repo/design-system/components/ui/input";
import { ArrowRight } from "lucide-react";
import { useValidateInput, MAX_PROMPT_LENGTH } from "@/components/welcome/featured/useValidateInput";

interface PromptFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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

  // Prevent submit if invalid
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (profanity || exceedsMaxLength) return;
    onSubmit(e);
  };

  const errorMsg = useMemo(() => {
    if (exceedsMaxLength) {
      return `Your promptxceeds the maximum length of ${MAX_PROMPT_LENGTH} characters`;
    }
    if (profanity) {
      return "Please fix your prompt as it may contain harmful words";
    }
    return null;
  }, [profanity, exceedsMaxLength]);

  return (
    <form
      onSubmit={handleSubmit}
      className="pt-0 px-4 pb-4 md:border-b border-t md:border-t-0 border-gray-200/30 relative z-10"
    >
      <div className="relative">
        <Input
          type="text"
          placeholder={
            isThrottled
              ? `Wait ${throttleTimeLeft}s...`
              : "Add your prompt to the queue..."
          }
          className={`w-full md:bg-white/50 bg-white/80 rounded-[24px] border border-solid border-[#DFDEDE] focus:ring-0 focus:border-[#DFDEDE] focus:outline-none pl-[25px] py-8 pr-16 ${isThrottled ? "opacity-50" : ""} shadow-[8px_12px_24px_0px_#0D131E26] ${profanity || exceedsMaxLength ? 'border-red-500' : ''}`}
          value={value}
          onChange={onChange}
          disabled={isThrottled || disabled}
        />
        <button
          type="submit"
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black text-white rounded-full w-10 h-10 flex items-center justify-center"
          disabled={isThrottled || disabled || !value.trim() || profanity || exceedsMaxLength}
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
      {errorMsg && (
        <div className="text-xs text-red-600 mt-2 text-center">{errorMsg}</div>
      )}
    </form>
  );
}
