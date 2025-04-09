"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatForm } from "./chat-form";
import { ChatMessage } from "./chat-message";
import { useStreamUpdates } from "@/hooks/useDreamshaper";
import { cn } from "@repo/design-system/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
      <div
        className={cn(
          "flex-1 overflow-y-auto space-y-4 mb-4 px-4 py-4",
          "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent"
        )}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p className="text-sm">
              Describe what you want to visualize and I&apos;ll help you create
              the perfect prompt.
            </p>
          </div>
        )}
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            role={message.role}
            content={message.content}
            suggestions={message.suggestions}
            onSuggestionClick={handleSuggestionClick}
            onFeedback={
              message.role === "assistant"
                ? isPositive => handleFeedback(index, isPositive)
                : undefined
            }
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-auto px-4 pb-4">
        <ChatForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
