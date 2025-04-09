import React, { useState, useRef } from "react";
import { AutoResizeTextarea } from "../ui/auto-resize-textarea";
import { Button } from "../ui/button";
import { ThumbsUp, ThumbsDown, Image as ImageIcon } from "lucide-react";

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

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <AutoResizeTextarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Describe what you want to visualize..."
            className="pr-24"
          />
          <div className="absolute right-2 bottom-2 flex items-center space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleImageClick}
              className="h-8 w-8"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (!input.trim() && !imageFile)}
              className="h-8"
            >
              {isLoading ? "Processing..." : "Submit"}
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
              size="icon"
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
              }}
              className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70"
            >
              ×
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
