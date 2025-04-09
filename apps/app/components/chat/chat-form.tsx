"use client";

import React, { useState, useRef } from "react";
import { AutoResizeTextarea } from "../ui/auto-resize-textarea";
import { Button } from "@repo/design-system/components/ui/button";
import { ImageIcon, WandSparkles, Loader2, X } from "lucide-react";
import { cn } from "@repo/design-system/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

interface ChatFormProps {
  onSubmit: (message: string, image?: File) => Promise<void>;
  isLoading?: boolean;
}

export function ChatForm({ onSubmit, isLoading = false }: ChatFormProps) {
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !imageFile) return;

    await onSubmit(input, imageFile || undefined);
    setInput("");
    setImageFile(null);
    setImagePreview(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isLoading && e.key === "Enter" && !(e.metaKey || e.ctrlKey || e.shiftKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={cn(
          "relative mx-auto flex justify-center items-center gap-2 h-14 md:h-auto md:min-h-14 md:gap-2 mt-4 mb-2 dark:bg-[#1A1A1A] bg-white md:rounded-xl py-2.5 px-3 md:py-1.5 md:px-3 w-[calc(100%-2rem)] md:w-[calc(min(100%,800px))] border-2 border-muted-foreground/10",
          "rounded-2xl shadow-[4px_12px_16px_0px_#37373F40]"
        )}>
          <div className="flex-1 relative flex items-center">
            <AutoResizeTextarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to visualize..."
              className="w-full shadow-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm outline-none bg-transparent py-3 font-sans"
            />
            <div className="absolute right-2 bottom-2 flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleImageClick}
                className="h-8 w-8 p-0"
                aria-label="Add image"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                disabled={isLoading || (!input.trim() && !imageFile)}
                className={cn(
                  "border-none items-center justify-center font-semibold text-xs bg-[#000000] flex disabled:bg-[#000000] disabled:opacity-80",
                  "w-auto h-9 aspect-square rounded-md"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <WandSparkles className="h-4 w-4 stroke-[2]" />
                )}
              </Button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
        {imagePreview && (
          <div className="relative w-32 h-32">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={removeImage}
              className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
