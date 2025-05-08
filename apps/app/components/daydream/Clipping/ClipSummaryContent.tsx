import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { TrackedButton } from "@/components/analytics/TrackedButton";
import { cn } from "@repo/design-system/lib/utils";

interface ClipSummaryContentProps {
  clipData: ClipData;
  setClipStep: (step: "summary" | "share") => void;
  setClipData: (clipData: ClipData) => void;
}

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

export function ClipSummaryContent({
  clipData,
  setClipStep,
  setClipData,
}: ClipSummaryContentProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isFeatured, setIsFeatured] = useState(true);
  const { lastSubmittedPrompt } = usePromptStore();
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);

  const storedPrompt = useMemo(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem("daydream_pending_clip_prompt")
      : null;
  }, []);

  const handleNext = async () => {
    let clipId;

    if (clipData.clipUrl && clipData.clipFilename) {
      try {
        setIsUploading(true);

        const videoBlob = await (await fetch(clipData.clipUrl)).blob();
        const thumbnailBlob =
          clipData.thumbnailUrl &&
          (await (await fetch(clipData.thumbnailUrl)).blob());

        const response = await fetch("/api/clips", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contentType: videoBlob.type,
            filename: clipData.clipFilename,
            prompt:
              clipData.lastSubmittedPrompt ||
              lastSubmittedPrompt ||
              storedPrompt ||
              "",
            isFeatured,
          }),
        });

        const {
          videoUploadUrl,
          thumbnailUploadUrl,
          videoUrl,
          thumbnailUrl,
          slug,
          id,
        } = await response.json();

        clipId = id;

        const uploadPromises = [];
        uploadPromises.push(uploadWithPresignedUrl(videoUploadUrl, videoBlob));
        if (thumbnailBlob) {
          uploadPromises.push(
            await uploadWithPresignedUrl(thumbnailUploadUrl, thumbnailBlob),
          );
        }

        await Promise.all(uploadPromises);

        await fetch(`/api/clips/${clipId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoUrl,
            thumbnailUrl,
            status: "completed",
          }),
        });

        if (storedPrompt) {
          localStorage.removeItem("daydream_pending_clip_prompt");
        }

        setClipData({
          ...clipData,
          serverClipUrl: videoUrl,
          slug,
        });

        setClipStep("share");
      } catch (error) {
        console.error("Error uploading clip:", error);

        if (clipId) {
          await fetch(`/api/clips/${clipId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "failed",
            }),
          });
        }

        toast.error("Failed to upload clip");
      } finally {
        setIsUploading(false);
      }
    }
  };

  useEffect(() => {
    if (mainVideoRef.current && bgVideoRef.current) {
      const mainVideo = mainVideoRef.current;
      const bgVideo = bgVideoRef.current;

      const syncPlay = () =>
        bgVideo.play().catch(e => console.error("Bg video play error:", e));
      const syncPause = () => bgVideo.pause();
      const syncTime = () => {
        if (Math.abs(mainVideo.currentTime - bgVideo.currentTime) > 0.1) {
          bgVideo.currentTime = mainVideo.currentTime;
        }
      };

      mainVideo.addEventListener("play", syncPlay);
      mainVideo.addEventListener("pause", syncPause);
      mainVideo.addEventListener("seeked", syncTime);
      mainVideo.addEventListener("loadedmetadata", syncTime);

      return () => {
        mainVideo.removeEventListener("play", syncPlay);
        mainVideo.removeEventListener("pause", syncPause);
        mainVideo.removeEventListener("seeked", syncTime);
        mainVideo.removeEventListener("loadedmetadata", syncTime);
      };
    }
  }, [clipData.clipUrl, clipData.recordingMode]);

  return (
    <DialogContent className="h-fit max-h-[86dvh] overflow-y-auto w-[calc(100%-32px)] sm:w-full sm:max-w-[55dvh] mx-auto rounded-xl p-4 pt-5 sm:p-5">
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
          <div
            className={cn(
              "w-full aspect-square relative rounded-md flex items-center justify-center overflow-hidden",
            )}
          >
            {clipData.recordingMode === "vertical" && (
              <video
                ref={bgVideoRef}
                src={clipData.clipUrl}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover filter blur-xl scale-110 z-0 rounded-md"
              />
            )}
            <video
              src={clipData.clipUrl}
              ref={mainVideoRef}
              autoPlay
              loop
              muted={false}
              playsInline
              controls
              poster={clipData.thumbnailUrl || undefined}
              className={cn(
                "rounded-md z-10",
                clipData.recordingMode === "vertical"
                  ? "w-auto h-full"
                  : "absolute inset-0 w-full h-full object-cover",
              )}
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
        <TrackedButton
          trackingEvent="daydream_clip_modal_next_clicked"
          trackingProperties={{
            submit_to_be_featured: isFeatured,
          }}
          onClick={handleNext}
          className="w-full items-center justify-center gap-2 rounded-md h-[40px] sm:h-[44px]"
          disabled={isUploading}
        >
          {isUploading ? "Processing..." : "Next"}
        </TrackedButton>
      </div>
    </DialogContent>
  );
}
