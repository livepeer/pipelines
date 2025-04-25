import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { toast } from "sonner";
import { Separator } from "@repo/design-system/components/ui/separator";
import {
  RadioGroup,
  RadioGroupItem,
} from "@repo/design-system/components/ui/radio-group";
import { Button } from "@repo/design-system/components/ui/button";

export type ClipRecordingMode = "horizontal" | "vertical" | "output-only";

interface ClipOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClip: (mode: ClipRecordingMode, thumbnailUrl: string | null) => void;
}

const LayoutOption = ({
  title,
  description,
  value,
  selectedValue,
  previewImg,
  onSelect,
}: {
  title: string;
  description: string;
  value: string;
  selectedValue?: string;
  previewImg: string | null;
  onSelect: (value: string) => void;
}) => (
  <div
    className={`relative flex flex-col border rounded-xl p-6 gap-4 overflow-hidden cursor-pointer border-gray-300  ${
      selectedValue === value
        ? "outline outline-2 outline-[#282828]"
        : "border-gray-300"
    }`}
    style={
      selectedValue === value
        ? { boxShadow: "12px 24px 33px 0px #14212D26" }
        : undefined
    }
    onClick={() => onSelect(value)}
  >
    <div className="hidden sm:block sm:h-52 bg-black rounded-xl overflow-hidden mb-3">
      {previewImg ? (
        <img
          src={previewImg}
          alt={`${title} preview`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white">
          Loading...
        </div>
      )}
    </div>

    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <RadioGroupItem value={value} id={value} className="sr-only" />
        <label
          htmlFor={value}
          className="font-medium text-[18px] text-[#161616]"
        >
          {title}
        </label>
      </div>
      <p className="text-[#707070] text-sm leading-[1.4]">{description}</p>
    </div>

    <div className="absolute top-0 left-0">
      <RadioGroupItem value={value} id={value} className="sr-only" />
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
  const [selectedMode, setSelectedMode] = useState<string>("output-only");

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

  useEffect(() => {
    if (!isOpen) {
      setIsCaptured(false);
    }
  }, [isOpen]);

  const handleValueChange = (value: string) => {
    setSelectedMode(value);
  };

  const handleCreateClip = () => {
    if (!isReady) {
      toast("Video frames not ready yet", {
        description: "Please wait a moment and try again",
      });
      return;
    }
    const thumbnailUrl =
      selectedMode === "horizontal"
        ? previewBlobs.horizontal
        : previewBlobs.outputOnly;
    onCreateClip(selectedMode as ClipRecordingMode, thumbnailUrl);
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="h-fit max-h-[90dvh] w-[calc(100%-32px)] sm:w-full sm:max-w-[650px] mx-auto overflow-y-auto rounded-xl p-6 pt-8 sm:p-8">
        <DialogHeader className="flex items-center">
          <DialogTitle className="text-2xl">
            How Would You Like to Share?
          </DialogTitle>
          <DialogDescription className="font-light text-center">
            Choose your preferred sharing option
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-1" />

        <RadioGroup
          value={selectedMode}
          onValueChange={handleValueChange}
          className="mt-2 sm:mt-4 mb-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8"
        >
          <LayoutOption
            title="Just the Output"
            description="Share only the final result — your input video (face) won't be included."
            value="output-only"
            selectedValue={selectedMode}
            previewImg={previewBlobs.outputOnly}
            onSelect={handleValueChange}
          />

          <LayoutOption
            title="Include input video"
            description="Share both your original video and the final result — your input video will be visible in the clip."
            value="horizontal"
            selectedValue={selectedMode}
            previewImg={previewBlobs.horizontal}
            onSelect={handleValueChange}
          />
        </RadioGroup>

        <Separator className="my-1" />

        <div className="w-full">
          <div className="flex gap-2">
            <Button
              onClick={handleCreateClip}
              className="flex-1 items-center justify-center gap-2 rounded-md h-[46px]"
            >
              Start recording
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
