import React, { useState } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Button } from "@repo/design-system/components/ui/button";
import { Separator } from "@repo/design-system/components/ui/separator";
import { toast } from "sonner";
import { ClipData } from "./types";
import { Switch } from "@repo/design-system/components/ui/switch";
import { usePromptStore } from "@/hooks/usePromptStore";

interface ClipSummaryContentProps {
  clipData: ClipData;
  setClipStep: (step: "summary" | "share") => void;
  setClipData: (clipData: ClipData) => void;
}

export function ClipSummaryContent({
  clipData,
  setClipStep,
  setClipData,
}: ClipSummaryContentProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isFeatured, setIsFeatured] = useState(true);
  const { lastSubmittedPrompt } = usePromptStore();

  const handleNext = async () => {
    if (clipData.clipUrl && clipData.clipFilename) {
      try {
        setIsUploading(true);
        // First, fetch the blob from the URL
        const response = await fetch(clipData.clipUrl);
        const blob = await response.blob();

        // Create a FormData object to send the file metadata
        const formData = new FormData();
        formData.append(
          "sourceClip",
          new File([blob], clipData.clipFilename, { type: blob.type }),
        );
        formData.append("isFeatured", isFeatured.toString());

        if (lastSubmittedPrompt) {
          formData.append("prompt", lastSubmittedPrompt);
        }

        // Get the presigned URL from our API
        const apiResponse = await fetch("/api/clips", {
          method: "POST",
          body: formData,
        });

        if (!apiResponse.ok) {
          throw new Error("Failed to get upload URL");
        }

        const data = await apiResponse.json();
        if (!data.success) {
          throw new Error("Failed to get upload URL");
        }

        // Upload directly to GCS using the presigned URL
        const uploadResponse = await fetch(data.clip.uploadUrl, {
          method: "PUT",
          body: blob,
          headers: {
            "Content-Type": blob.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload clip to storage");
        }

        // Update the clip data with the final URL
        const finalUrl = `https://storage.googleapis.com/${data.clip.path}`;
        setClipData({
          ...clipData,
          serverClipUrl: finalUrl,
          slug: data.clip.slug,
        });
        setClipStep("share");
      } catch (error) {
        console.error("Error uploading clip:", error);
        toast.error("Failed to upload clip");
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <DialogContent className="h-fit max-h-[90dvh] w-[calc(100%-32px)] sm:w-full sm:max-w-[55dvh] mx-auto rounded-xl p-4 pt-5 sm:p-5">
      <DialogHeader className="flex items-center mb-1">
        <DialogTitle className="text-xl sm:text-2xl">
          Almost Ready to Share!
        </DialogTitle>
        <DialogDescription className="font-light text-center text-sm">
          Choose how widely you want to showcase your creation
        </DialogDescription>
      </DialogHeader>

      <div className="flex justify-center w-full">
        {clipData.clipUrl && (
          <div className="w-full aspect-square relative">
            <video
              src={clipData.clipUrl}
              autoPlay
              loop
              muted={false}
              playsInline
              controls
              className="absolute inset-0 w-full h-full object-cover rounded-md"
            />
          </div>
        )}
      </div>

      <Separator className="mt-2 mb-2 h-[1px] bg-gray-200 w-full" />

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start">
          <div className="text-sm font-medium">Submit to be featured</div>
          <div className="text-xs sm:text-sm text-muted-foreground font-light">
            Let your clip shine on the Daydream community page
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={isFeatured}
            onCheckedChange={setIsFeatured}
            disabled={isUploading}
          />
        </div>
      </div>

      <div className="w-full mt-3">
        <Button
          onClick={handleNext}
          className="w-full items-center justify-center gap-2 rounded-md h-[40px] sm:h-[44px]"
          disabled={isUploading}
        >
          {isUploading ? "Processing..." : "Next"}
        </Button>
      </div>
    </DialogContent>
  );
}
