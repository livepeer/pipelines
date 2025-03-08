import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { toast } from "sonner";
import { useVideoFrames } from "../hooks/useVideoFrames";

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

// Horizontal Layout
const HorizontalLayout = ({
  outputCanvas,
  inputCanvas,
}: {
  outputCanvas: React.RefObject<HTMLCanvasElement>;
  inputCanvas: React.RefObject<HTMLCanvasElement>;
}) => (
  <div className="relative w-full h-full flex items-center justify-center">
    <canvas
      ref={outputCanvas}
      className="max-w-full max-h-full rounded-md bg-black"
    />
    <div className="absolute bottom-4 right-4 max-w-[25%] overflow-hidden rounded-sm">
      <canvas ref={inputCanvas} className="w-full h-full bg-black" />
    </div>
  </div>
);

// Vertical Layout
const VerticalLayout = ({
  outputCanvas,
  inputCanvas,
  outputDimensions,
  inputDimensions,
}: {
  outputCanvas: React.RefObject<HTMLCanvasElement>;
  inputCanvas: React.RefObject<HTMLCanvasElement>;
  outputDimensions: { width: number; height: number };
  inputDimensions: { width: number; height: number };
}) => (
  <div className="flex flex-col items-center gap-1">
    <canvas
      ref={outputCanvas}
      className="rounded-md bg-black"
      style={{
        width: `${outputDimensions.width}px`,
        height: `${outputDimensions.height}px`,
      }}
    />
    <canvas
      ref={inputCanvas}
      className="rounded-md bg-black"
      style={{
        width: `${inputDimensions.width}px`,
        height: `${inputDimensions.height}px`,
      }}
    />
  </div>
);

// Output Only Layout
const OutputOnlyLayout = ({
  outputCanvas,
}: {
  outputCanvas: React.RefObject<HTMLCanvasElement>;
}) => (
  <canvas
    ref={outputCanvas}
    className="max-w-full max-h-full rounded-md bg-black"
  />
);

export function ClipOptionsModal({
  isOpen,
  onClose,
  onCreateClip,
}: ClipOptionsModalProps) {
  const { canvasRefs, verticalDimensions, isReady } = useVideoFrames(
    isOpen,
    onClose,
  );

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

        <div className="mt-4 mb-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <LayoutOption
            title="Combined"
            mode="horizontal"
            onSelect={handleSelectMode}
          >
            <HorizontalLayout
              outputCanvas={canvasRefs.horizontalOutput}
              inputCanvas={canvasRefs.horizontalInput}
            />
          </LayoutOption>

          <LayoutOption
            title="Vertical"
            mode="vertical"
            onSelect={handleSelectMode}
          >
            <VerticalLayout
              outputCanvas={canvasRefs.verticalOutput}
              inputCanvas={canvasRefs.verticalInput}
              outputDimensions={verticalDimensions.output}
              inputDimensions={verticalDimensions.input}
            />
          </LayoutOption>

          <LayoutOption
            title="Output Only"
            mode="output-only"
            onSelect={handleSelectMode}
          >
            <OutputOnlyLayout outputCanvas={canvasRefs.outputOnly} />
          </LayoutOption>
        </div>
      </DialogContent>
    </Dialog>
  );
}
