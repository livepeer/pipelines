"use client";

import React from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";

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
      className={`flex flex-col space-y-4 ${
        role === "user" ? "items-end" : "items-start"
      }`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick?.(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}

      {role === "assistant" && onFeedback && (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onFeedback(true)}
            className="h-8 w-8"
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onFeedback(false)}
            className="h-8 w-8"
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
