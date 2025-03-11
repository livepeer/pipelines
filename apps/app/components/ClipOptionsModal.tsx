import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { toast } from "sonner";

export type ClipRecordingMode = "horizontal" | "vertical" | "output-only";

interface ClipOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClip: (mode: ClipRecordingMode) => void;
}

const LayoutOption = ({
  title,
  mode,
  onSelect,
  children,
}: {
  title: string;
  mode: ClipRecordingMode;
  onSelect: (mode: ClipRecordingMode) => void;
  children: React.ReactNode;
}) => (
  <div
    className="flex flex-col gap-2 border rounded-md p-3 bg-black text-white hover:bg-black/80 cursor-pointer transition-colors"
    onClick={() => onSelect(mode)}
  >
    <div className="font-medium text-center">{title}</div>
    <div className="bg-black rounded-md p-2 h-48 flex items-center justify-center">
      {children}
    </div>
  </div>
);

export function ClipOptionsModal({
  isOpen,
  onClose,
  onCreateClip,
}: ClipOptionsModalProps) {
  const [previewBlobs, setPreviewBlobs] = useState<{
    horizontal: string | null;
    outputOnly: string | null;
  }>({ horizontal: null, outputOnly: null });
  const [isReady, setIsReady] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);

  useEffect(() => {
    if (!isOpen || isCaptured) return;

    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    document.body.appendChild(container);

    const capturePreviewsToBlob = async () => {
      try {
        const videos = document.querySelectorAll("video");
        if (videos.length < 2) {
          toast("Can't create clip", {
            description: "Video elements not found",
          });
          onClose();
          return;
        }

        const outputVideo = videos[0] as HTMLVideoElement;
        const inputVideo = videos[1] as HTMLVideoElement;

        if (outputVideo.readyState < 2 || inputVideo.readyState < 2) {
          setTimeout(capturePreviewsToBlob, 500);
          return;
        }

        const horizontalCanvas = document.createElement("canvas");
        const outputOnlyCanvas = document.createElement("canvas");

        container.appendChild(horizontalCanvas);
        container.appendChild(outputOnlyCanvas);

        const previewWidth = 300;
        const previewHeight = Math.round(
          previewWidth * (outputVideo.videoHeight / outputVideo.videoWidth),
        );

        horizontalCanvas.width = previewWidth;
        horizontalCanvas.height = previewHeight;
        outputOnlyCanvas.width = previewWidth;
        outputOnlyCanvas.height = previewHeight;

        const horizontalCtx = horizontalCanvas.getContext("2d");
        const outputOnlyCtx = outputOnlyCanvas.getContext("2d");

        if (!horizontalCtx || !outputOnlyCtx) {
          throw new Error("Could not get canvas contexts");
        }

        horizontalCtx.fillStyle = "black";
        horizontalCtx.fillRect(0, 0, previewWidth, previewHeight);
        horizontalCtx.drawImage(outputVideo, 0, 0, previewWidth, previewHeight);

        outputOnlyCtx.fillStyle = "black";
        outputOnlyCtx.fillRect(0, 0, previewWidth, previewHeight);
        outputOnlyCtx.drawImage(outputVideo, 0, 0, previewWidth, previewHeight);

        const pipSize = 0.25;
        const pipWidth = Math.floor(previewWidth * pipSize);
        const pipHeight = Math.floor(
          pipWidth * (inputVideo.videoHeight / inputVideo.videoWidth),
        );
        const pipX = previewWidth - pipWidth - 16;
        const pipY = previewHeight - pipHeight - 16;

        horizontalCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
        horizontalCtx.beginPath();
        horizontalCtx.roundRect(
          pipX - 2,
          pipY - 2,
          pipWidth + 4,
          pipHeight + 4,
          8,
        );
        horizontalCtx.fill();

        horizontalCtx.drawImage(inputVideo, pipX, pipY, pipWidth, pipHeight);

        const getCanvasBlob = (canvas: HTMLCanvasElement): Promise<string> => {
          return new Promise((resolve, reject) => {
            canvas.toBlob(
              blob => {
                if (!blob) reject(new Error("Failed to create blob"));
                else resolve(URL.createObjectURL(blob));
              },
              "image/jpeg",
              0.95,
            );
          });
        };

        const horizontalBlob = await getCanvasBlob(horizontalCanvas);
        const outputOnlyBlob = await getCanvasBlob(outputOnlyCanvas);

        setPreviewBlobs({
          horizontal: horizontalBlob,
          outputOnly: outputOnlyBlob,
        });

        setIsCaptured(true);
        setIsReady(true);

        container.removeChild(horizontalCanvas);
        container.removeChild(outputOnlyCanvas);
      } catch (error) {
        console.error("Error capturing frames:", error);
        toast("Can't create clip", {
          description: "Failed to capture video frames",
        });
        onClose();
      }
    };

    capturePreviewsToBlob();

    return () => {
      document.body.removeChild(container);

      if (previewBlobs.horizontal) URL.revokeObjectURL(previewBlobs.horizontal);
      if (previewBlobs.outputOnly) URL.revokeObjectURL(previewBlobs.outputOnly);
    };
  }, [
    isOpen,
    isCaptured,
    onClose,
    previewBlobs.horizontal,
    previewBlobs.outputOnly,
  ]);

  const handleSelectMode = (mode: ClipRecordingMode) => {
    if (!isReady) {
      toast("Video frames not ready yet", {
        description: "Please wait a moment and try again",
      });
      return;
    }
    onCreateClip(mode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] mx-auto sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader className="flex flex-col items-center justify-center">
          <DialogTitle className="text-center w-full">
            Choose your clip layout
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 mb-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LayoutOption
            title="Combined"
            mode="horizontal"
            onSelect={handleSelectMode}
          >
            {isReady && previewBlobs.horizontal ? (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={previewBlobs.horizontal}
                  alt="Combined preview"
                  className="max-w-full max-h-full rounded-md"
                />
              </div>
            ) : (
              <div className="text-white">Loading...</div>
            )}
          </LayoutOption>

          <LayoutOption
            title="Output Only"
            mode="output-only"
            onSelect={handleSelectMode}
          >
            {isReady && previewBlobs.outputOnly ? (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={previewBlobs.outputOnly}
                  alt="Output only preview"
                  className="max-w-full max-h-full rounded-md"
                />
              </div>
            ) : (
              <div className="text-white">Loading...</div>
            )}
          </LayoutOption>
        </div>
      </DialogContent>
    </Dialog>
  );
}
