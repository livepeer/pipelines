"use client";

import { useState } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { useToast } from "@repo/design-system/components/ui/use-toast";
import { getAccessToken } from "@privy-io/react-auth";

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      if (title) {
        formData.append("title", title);
      }

      if (prompt) {
        formData.append("prompt", prompt);
      }

      const response = await fetch("/api/clips/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload clip");
      }

      toast({
        title: "Success",
        description: "Clip uploaded successfully",
      });

      // Reset form
      setFile(null);
      setTitle("");
      setPrompt("");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload clip",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Upload Clip</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title (Optional)</Label>
          <Input
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter a title for your clip"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt (Optional)</Label>
          <Input
            id="prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Enter a prompt"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="file">Video File</Label>
          <Input
            id="file"
            type="file"
            onChange={handleFileChange}
            accept="video/mp4,video/quicktime,video/x-msvideo"
            className="cursor-pointer"
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isUploading || !file}
        >
          {isUploading ? "Uploading..." : "Upload Clip"}
        </Button>
      </form>
    </div>
  );
}
