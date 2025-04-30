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

  const uploadWithPresignedUrl = async (url: string, blob: Blob) => {
    const response = await fetch(url, {
      method: "PUT",
      body: blob,
      headers: {
        "Content-Type": blob.type,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to upload to presigned URL: ${response.status} ${response.statusText}`,
      );
    }

    return response;
  };

  const handleNext = async () => {
    if (clipData.clipUrl && clipData.clipFilename) {
      try {
        setIsUploading(true);

        // Fetch the blob from the URL
        const response = await fetch(clipData.clipUrl);
        const blob = await response.blob();

        // Get a presigned URL for uploading the clip
        const presignedResponse = await fetch("/api/clips/presigned-upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contentType: blob.type,
            filename: clipData.clipFilename,
          }),
        });

        if (!presignedResponse.ok) {
          throw new Error("Failed to get presigned URL");
        }

        const presignedData = await presignedResponse.json();

        // Upload the clip directly to Google Cloud Storage
        await uploadWithPresignedUrl(presignedData.uploadUrl, blob);

        // Get the public URL of the uploaded clip
        const gcsPublicUrl = `https://storage.googleapis.com/${presignedData.filePath}`;

        // Upload thumbnail if available
        let thumbnailUrl = null;
        if (clipData.thumbnailUrl) {
          try {
            const thumbnailResponse = await fetch(clipData.thumbnailUrl);
            const thumbnailBlob = await thumbnailResponse.blob();

            // Get a presigned URL for uploading the thumbnail
            const thumbnailPresignedResponse = await fetch(
              "/api/clips/presigned-thumbnail",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  clipId: presignedData.clipId,
                  contentType: "image/jpeg",
                }),
              },
            );

            if (thumbnailPresignedResponse.ok) {
              const thumbnailPresignedData =
                await thumbnailPresignedResponse.json();

              // Upload the thumbnail directly to Google Cloud Storage
              await uploadWithPresignedUrl(
                thumbnailPresignedData.uploadUrl,
                thumbnailBlob,
              );

              // Get the public URL of the uploaded thumbnail
              thumbnailUrl = `https://storage.googleapis.com/${thumbnailPresignedData.thumbnailPath}`;
            }
          } catch (thumbnailError) {
            console.error("Error uploading thumbnail:", thumbnailError);
          }
        }

        // Notify the server that uploads are complete and create database entries
        const finalizationData = {
          clipId: presignedData.clipId,
          videoUrl: gcsPublicUrl,
          thumbnailUrl,
          isFeatured,
          prompt: lastSubmittedPrompt || "",
        };

        const apiResponse = await fetch("/api/clips", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(finalizationData),
        });

        if (apiResponse.ok) {
          const data = await apiResponse.json();
          if (!data.success) {
            throw new Error("Failed to finalize clip");
          }

          setClipData({
            ...clipData,
            serverClipUrl: data.clip?.videoUrl,
            slug: data.clip?.slug,
          });

          setClipStep("share");
        } else {
          console.error("Failed to finalize clip");
          toast.error("Failed to process clip");
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
