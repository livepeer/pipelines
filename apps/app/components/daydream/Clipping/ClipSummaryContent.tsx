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

  const handleNext = async () => {
    // NOTE: This function assumes that the POST handler for /api/clips is implemented
    // to receive a FormData with a 'sourceClip' file field. If the API endpoint
    // is not yet implemented, you'll need to create it to handle this FormData.
    if (clipData.clipUrl && clipData.clipFilename) {
      try {
        setIsUploading(true);
        // First, fetch the blob from the URL
        const response = await fetch(clipData.clipUrl);
        const blob = await response.blob();

        // Create a FormData object to send the file
        const formData = new FormData();
        formData.append(
          "sourceClip",
          new File([blob], clipData.clipFilename, { type: blob.type }),
        );
        formData.append("isFeatured", isFeatured.toString());

        // Make the API request
        const apiResponse = await fetch("/api/clips", {
          method: "POST",
          body: formData,
        });

        if (apiResponse.ok) {
          const data = await apiResponse.json();
          if (!data.success) {
            throw new Error("Failed to upload clip");
          }
          setClipData({
            ...clipData,
            serverClipUrl: data.clip?.videoUrl,
          });
          setClipStep("share");
        } else {
          console.error("Failed to upload clip:");
          toast.error("Failed to upload clip");
        }
      } catch (error) {
        console.error("Error uploading clip:", error);
        toast.error("Failed to upload clip");
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <DialogContent className="h-fit max-h-[90dvh] w-[calc(100%-32px)] sm:w-full sm:max-w-[55dvh] mx-auto rounded-xl p-6 pt-8 sm:p-8">
      <DialogHeader className="flex items-center">
        <DialogTitle className="text-2xl">Almost Ready to Share!</DialogTitle>
        <DialogDescription className="font-light text-center">
          Choose how widely you want to showcase your creation
        </DialogDescription>
      </DialogHeader>

      <Separator className="my-1" />

      <div className="flex justify-center">
        {clipData.clipUrl && (
          <video
            src={clipData.clipUrl}
            autoPlay
            loop
            muted={false}
            playsInline
            controls
            className="w-full sm:h-[50dvh] aspect-square rounded-md"
          />
        )}
      </div>

      <Separator className="hidden sm:block my-1 sm:my-2 h-[1px] bg-gray-200 w-[90%] mx-auto" />

      <div className="flex items-center justify-between mt-2">
        <div className="flex flex-col items-start">
          <div className="text-sm font-medium">Submit to be featured</div>
          <div className="text-sm text-muted-foreground font-light">
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

      <Separator className="my-1" />

      <div className="w-full">
        <div className="flex gap-2">
          <Button
            onClick={handleNext}
            className="flex-1 items-center justify-center gap-2 rounded-md h-[46px]"
            disabled={isUploading}
          >
            {isUploading ? "Processing..." : "Next"}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
