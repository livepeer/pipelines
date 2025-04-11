"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatForm } from "./chat-form";
import { ChatMessage } from "./chat-message";
import { useStreamUpdates } from "@/hooks/useDreamshaper";
import { cn } from "@repo/design-system/lib/utils";
import { Button } from "@repo/design-system/components/ui/button";
import { RotateCcw } from "lucide-react";
import {
  RadioGroup,
  RadioGroupItem,
} from "@repo/design-system/components/ui/radio-group";
import { Label } from "@repo/design-system/components/ui/label";

interface Message {
  role: "user" | "assistant" | "thinking";
  content: string;
  suggestions?: string[];
}

type PromptMode = "assisted" | "classic";

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [promptMode, setPromptMode] = useState<PromptMode>("assisted");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { handleStreamUpdate } = useStreamUpdates();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (message: string) => {
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: message,
    };
    setMessages(prev => [...prev, userMessage]);

    // Add thinking message
    const thinkingMessage: Message = {
      role: "thinking",
      content: "Thinking...",
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      if (promptMode === "classic") {
        // In classic mode, just update the stream directly
        await handleStreamUpdate(message, { silent: true });
        // Remove thinking message
        setMessages(prev => prev.filter(msg => msg.role !== "thinking"));
        return;
      }

      // Prepare the request to the chat API
      const formData = new FormData();
      formData.append("message", message);

      // Add message history for context
      const messageHistory = messages.slice(-4); // Keep last 4 messages for context
      formData.append("messages", JSON.stringify(messageHistory));

      // Call the chat API to process the prompt
      const response = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Use the handleStreamUpdate hook to update the stream with the processed prompt
      await handleStreamUpdate(message, { silent: true });

      // Remove thinking message and add assistant message
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.role !== "thinking");
        return [
          ...filtered,
          {
            role: "assistant",
            content: data.content,
            suggestions: data.suggestions,
          },
        ];
      });
    } catch (error) {
      console.error("Error:", error);
      // Remove thinking message and add error message
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.role !== "thinking");
        return [
          ...filtered,
          {
            role: "assistant",
            content:
              "Sorry, there was an error processing your request. Please try again.",
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSubmit(suggestion);
  };

  const handleFeedback = async (messageIndex: number, isPositive: boolean) => {
    // TODO: Implement feedback handling
    console.log("Feedback:", { messageIndex, isPositive });
  };

  const handleStartOver = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center space-x-4">
          <RadioGroup
            value={promptMode}
            onValueChange={value => setPromptMode(value as PromptMode)}
            className="flex items-center space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="assisted" id="assisted" />
              <Label htmlFor="assisted">Assisted</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="classic" id="classic" />
              <Label htmlFor="classic">Classic</Label>
            </div>
          </RadioGroup>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartOver}
            className="text-muted-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Start over
          </Button>
        )}
      </div>
      <div
        className={cn(
          "flex-1 overflow-y-auto space-y-4 mb-4 px-4 py-4",
          "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent",
        )}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p className="text-sm">
              {promptMode === "assisted"
                ? "Describe what you want to visualize and I'll help you create the perfect prompt."
                : "Enter your prompt directly to generate an image."}
            </p>
          </div>
        )}
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            role={message.role}
            content={message.content}
            suggestions={
              promptMode === "assisted" ? message.suggestions : undefined
            }
            onSuggestionClick={handleSuggestionClick}
            onFeedback={
              message.role === "assistant" && promptMode === "assisted"
                ? isPositive => handleFeedback(index, isPositive)
                : undefined
            }
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-auto px-4 pb-4">
        <ChatForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          placeholder={
            promptMode === "assisted"
              ? "Describe what you want to visualize..."
              : "Enter your prompt..."
          }
        />
      </div>
    </div>
  );
}
