import React from "react";
import { Input } from "@repo/design-system/components/ui/input";

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
  return (
    <form
      onSubmit={onSubmit}
      className="p-4 md:border-b border-t md:border-t-0 border-gray-200/30 relative z-10"
    >
      <div className="relative">
        <Input
          type="text"
          placeholder={
            isThrottled
              ? `Wait ${throttleTimeLeft}s...`
              : "Add your prompt to the queue..."
          }
          className={`w-full md:bg-white/50 bg-white/80 rounded-lg border-none focus:ring-0 focus:border-none focus:outline-none ${isThrottled ? "opacity-50" : ""}`}
          value={value}
          onChange={onChange}
          disabled={isThrottled || disabled}
        />
      </div>
    </form>
  );
}
