"use client";

import React from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@repo/design-system/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  onFeedback?: (isPositive: boolean) => void;
}

export function ChatMessage({
  role,
  content,
  suggestions,
  onSuggestionClick,
  onFeedback,
}: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2",
        role === "user" ? "items-end" : "items-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted/50 text-foreground",
          role === "assistant" ? "rounded-tl-sm" : "rounded-tr-sm",
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-w-[85%]">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick?.(suggestion)}
              className={cn(
                "text-xs h-7 bg-background hover:bg-muted",
                "border border-input shadow-sm",
                "transition-colors duration-200",
              )}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}

      {role === "assistant" && onFeedback && (
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onFeedback(true)}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <ThumbsUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onFeedback(false)}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <ThumbsDown className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
