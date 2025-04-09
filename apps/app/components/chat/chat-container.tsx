"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatForm } from "./chat-form";
import { ChatMessage } from "./chat-message";
import { useStreamUpdates } from "@/hooks/useDreamshaper";

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
    const userMessage: Message = { role: "user", content: message };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Use the handleStreamUpdate hook to update the stream
      await handleStreamUpdate(message, { silent: true });

      // Add assistant message with a success response
      const assistantMessage: Message = {
        role: "assistant",
        content:
          "I've updated the visualization based on your description. You should see the changes reflected in the main display.",
        suggestions: [
          "Make it more detailed",
          "Add more dramatic lighting",
          "Include additional elements",
        ],
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
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
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
      <ChatForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
