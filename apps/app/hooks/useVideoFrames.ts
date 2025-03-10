import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

export function useVideoFrames(isOpen: boolean, onClose: () => void) {
  // Canvas refs
  const horizontalOutputRef = useRef<HTMLCanvasElement>(null);
  const horizontalInputRef = useRef<HTMLCanvasElement>(null);
  const verticalOutputRef = useRef<HTMLCanvasElement>(null);
  const verticalInputRef = useRef<HTMLCanvasElement>(null);
  const outputOnlyRef = useRef<HTMLCanvasElement>(null);

  const [verticalOutputDimensions, setVerticalOutputDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [verticalInputDimensions, setVerticalInputDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsReady(false);
      return;
    }

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

    if (outputVideo.readyState < 2) {
      const checkVideoReady = setTimeout(() => {
        if (outputVideo.readyState < 2) {
          toast("Can't create clip", {
            description:
              "Output video is not ready yet. Please try again in a moment.",
          });
          onClose();
        } else {
          captureFramesOnce();
        }
      }, 1000);

      return () => clearTimeout(checkVideoReady);
    }

    captureFramesOnce();

    function captureFramesOnce() {
      try {
        const outputAspectRatio =
          outputVideo.videoWidth / outputVideo.videoHeight;
        const inputAspectRatio = inputVideo.videoWidth / inputVideo.videoHeight;

        if (horizontalOutputRef.current) {
          const ctx = horizontalOutputRef.current.getContext("2d");
          if (!ctx) throw new Error("Could not get canvas context");

          horizontalOutputRef.current.width = 240;
          horizontalOutputRef.current.height = Math.round(240 / outputAspectRatio);

          ctx.drawImage(
            outputVideo,
            0,
            0,
            horizontalOutputRef.current.width,
            horizontalOutputRef.current.height,
          );
        }

        if (horizontalInputRef.current) {
          const ctx = horizontalInputRef.current.getContext("2d");
          if (!ctx) throw new Error("Could not get canvas context");

          horizontalInputRef.current.width = 60;
          horizontalInputRef.current.height = Math.round(60 / inputAspectRatio);

          ctx.drawImage(
            inputVideo,
            0,
            0,
            horizontalInputRef.current.width,
            horizontalInputRef.current.height,
          );
        }

        const containerHeight = 180;
        const maxWidth = 200;

        const totalAspectUnits = 1 / outputAspectRatio + 1 / inputAspectRatio;
        const outputHeightRatio = 1 / outputAspectRatio / totalAspectUnits;

        let outputHeight = Math.floor(containerHeight * outputHeightRatio) - 1;
        let inputHeight = containerHeight - outputHeight - 1;

        let outputWidth = Math.floor(outputHeight * outputAspectRatio);
        let inputWidth = Math.floor(inputHeight * inputAspectRatio);

        if (outputWidth > maxWidth) {
          outputWidth = maxWidth;
          const newOutputHeight = Math.floor(outputWidth / outputAspectRatio);
          if (newOutputHeight <= outputHeight) {
            outputHeight = newOutputHeight;
          }
        }

        if (inputWidth > maxWidth) {
          inputWidth = maxWidth;
          const newInputHeight = Math.floor(inputWidth / inputAspectRatio);
          if (newInputHeight <= inputHeight) {
            inputHeight = newInputHeight;
          }
        }

        setVerticalOutputDimensions({ width: outputWidth, height: outputHeight });
        setVerticalInputDimensions({ width: inputWidth, height: inputHeight });

        if (verticalOutputRef.current) {
          verticalOutputRef.current.width = outputWidth;
          verticalOutputRef.current.height = outputHeight;

          const ctx = verticalOutputRef.current.getContext("2d");
          if (ctx) {
            ctx.drawImage(
              outputVideo,
              0,
              0,
              outputWidth,
              outputHeight,
            );
          }
        }

        if (verticalInputRef.current) {
          verticalInputRef.current.width = inputWidth;
          verticalInputRef.current.height = inputHeight;

          const ctx = verticalInputRef.current.getContext("2d");
          if (ctx) {
            ctx.drawImage(
              inputVideo,
              0,
              0,
              inputWidth,
              inputHeight,
            );
          }
        }

        if (outputOnlyRef.current) {
          outputOnlyRef.current.width = 240;
          outputOnlyRef.current.height = Math.round(240 / outputAspectRatio);

          const ctx = outputOnlyRef.current.getContext("2d");
          if (ctx) {
            ctx.drawImage(
              outputVideo,
              0,
              0,
              outputOnlyRef.current.width,
              outputOnlyRef.current.height,
            );
          }
        }

        setIsReady(true);
      } catch (error) {
        console.error("Error capturing frames:", error);
        toast("Can't create clip", {
          description:
            error instanceof Error
              ? error.message
              : "Failed to capture video frames",
        });
        onClose();
      }
    }
  }, [isOpen, onClose]);

  return {
    canvasRefs: {
      horizontalOutput: horizontalOutputRef,
      horizontalInput: horizontalInputRef,
      verticalOutput: verticalOutputRef,
      verticalInput: verticalInputRef,
      outputOnly: outputOnlyRef,
    },
    verticalDimensions: {
      output: verticalOutputDimensions,
      input: verticalInputDimensions,
    },
    isReady,
  };
}
