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
import { ClipRecordingMode } from "@/hooks/useVideoClip";

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
    <div
      className={`hidden sm:flex sm:h-52 rounded-xl overflow-hidden mb-3 justify-center items-center ${
        value === "vertical" ? "bg-white" : "bg-black"
      }`}
    >
      {previewImg ? (
        <img
          src={previewImg}
          alt={`${title} preview`}
          className={`${
            value === "vertical"
              ? "h-full max-w-full w-auto object-contain"
              : "w-full h-full object-cover"
          }`}
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
      <p className="hidden sm:block text-[#707070] text-sm leading-[1.4]">
        {description}
      </p>
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
    vertical: string | null;
    outputOnly: string | null;
  }>({ vertical: null, outputOnly: null });
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

        const verticalCanvas = document.createElement("canvas");
        const outputOnlyCanvas = document.createElement("canvas");

        container.appendChild(verticalCanvas);
        container.appendChild(outputOnlyCanvas);

        const previewWidth = 300;
        const previewHeight = Math.round(
          previewWidth * (outputVideo.videoHeight / outputVideo.videoWidth),
        );

        outputOnlyCanvas.width = previewWidth;
        outputOnlyCanvas.height = previewHeight;
        verticalCanvas.width = previewWidth;
        verticalCanvas.height = previewHeight * 2;

        const verticalCtx = verticalCanvas.getContext("2d");
        const outputOnlyCtx = outputOnlyCanvas.getContext("2d");

        if (!verticalCtx || !outputOnlyCtx) {
          throw new Error("Could not get canvas contexts");
        }

        outputOnlyCtx.fillStyle = "black";
        outputOnlyCtx.fillRect(0, 0, previewWidth, previewHeight);
        outputOnlyCtx.drawImage(outputVideo, 0, 0, previewWidth, previewHeight);

        verticalCtx.fillStyle = "black";
        verticalCtx.fillRect(0, 0, previewWidth, verticalCanvas.height);

        const outputAspectRatio =
          outputVideo.videoWidth / outputVideo.videoHeight;
        const outputHeight = previewHeight;
        const outputWidth = outputHeight * outputAspectRatio;
        const outputX = (previewWidth - outputWidth) / 2;

        verticalCtx.drawImage(
          outputVideo,
          outputX,
          0,
          outputWidth,
          outputHeight,
        );

        const inputAspectRatio = inputVideo.videoWidth / inputVideo.videoHeight;
        const inputHeight = previewHeight;
        const inputWidth = inputHeight * inputAspectRatio;
        const inputX = (previewWidth - inputWidth) / 2;

        verticalCtx.drawImage(
          inputVideo,
          inputX,
          previewHeight,
          inputWidth,
          inputHeight,
        );

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

        const verticalBlob = await getCanvasBlob(verticalCanvas);
        const outputOnlyBlob = await getCanvasBlob(outputOnlyCanvas);

        setPreviewBlobs({
          vertical: verticalBlob,
          outputOnly: outputOnlyBlob,
        });

        setIsCaptured(true);
        setIsReady(true);

        container.removeChild(verticalCanvas);
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

      if (previewBlobs.vertical) URL.revokeObjectURL(previewBlobs.vertical);
      if (previewBlobs.outputOnly) URL.revokeObjectURL(previewBlobs.outputOnly);
    };
  }, [
    isOpen,
    isCaptured,
    onClose,
    previewBlobs.vertical,
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

    let thumbnailUrl = previewBlobs.outputOnly;
    if (selectedMode === "vertical") {
      thumbnailUrl = previewBlobs.vertical;
    }

    onCreateClip(selectedMode as ClipRecordingMode, thumbnailUrl);
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="flex flex-col h-fit max-h-[86dvh] w-[calc(100%-32px)] sm:w-full sm:max-w-[650px] mx-auto overflow-hidden rounded-xl p-0 sm:p-0">
        <div className="p-6 pt-8 sm:p-8">
          <DialogHeader className="flex items-center">
            <DialogTitle className="text-2xl">
              How Would You Like to Share?
            </DialogTitle>
            <DialogDescription className="font-light text-center">
              Choose your preferred sharing option
            </DialogDescription>
          </DialogHeader>
        </div>

        <Separator className="my-1 shrink-0" />

        <div className="flex-grow overflow-y-auto px-6 sm:px-8">
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
              title="Vertical Stack"
              description="Stack your input video on top of the output video in a vertical layout."
              value="vertical"
              selectedValue={selectedMode}
              previewImg={previewBlobs.vertical}
              onSelect={handleValueChange}
            />
          </RadioGroup>
        </div>

        <Separator className="my-1 shrink-0" />

        <div className="w-full p-6 sm:p-8">
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
