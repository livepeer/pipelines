"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatForm } from "./chat-form";
import { ChatMessage } from "./chat-message";
import { useStreamUpdates } from "@/hooks/useDreamshaper";
import { cn } from "@repo/design-system/lib/utils";
import { Button } from "@repo/design-system/components/ui/button";
import { RotateCcw } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

type PromptMode = "freeform" | "assisted";

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

  const handleSubmit = async (message: string, image?: File) => {
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: message + (image ? " [Image uploaded]" : ""),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      if (promptMode === "freeform") {
        // In freeform mode, just update the stream directly
        await handleStreamUpdate(message, { silent: true });
        return;
      }

      // Prepare the request to the chat API
      const formData = new FormData();
      formData.append("message", message);

      // Add message history for context
      const messageHistory = messages.slice(-4); // Keep last 4 messages for context
      formData.append("messages", JSON.stringify(messageHistory));

      if (image) {
        formData.append("image", image);
      }

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

      // Add assistant message with the processed prompt and suggestions
      const assistantMessage: Message = {
        role: "assistant",
        content: data.content,
        suggestions: data.suggestions,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      // Add error message
      const errorMessage: Message = {
        role: "assistant",
        content:
          "Sorry, there was an error processing your request. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
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

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center space-x-2">
          <Button
            variant={promptMode === "assisted" ? "default" : "outline"}
            size="sm"
            onClick={() => setPromptMode("assisted")}
          >
            Assisted
          </Button>
          <Button
            variant={promptMode === "freeform" ? "default" : "outline"}
            size="sm"
            onClick={() => setPromptMode("freeform")}
          >
            Freeform
          </Button>
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
            suggestions={promptMode === "assisted" ? message.suggestions : undefined}
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
          placeholder={promptMode === "assisted" 
            ? "Describe what you want to visualize..." 
            : "Enter your prompt..."}
        />
      </div>
    </div>
  );
}
