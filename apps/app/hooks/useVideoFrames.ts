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

    const setCanvasSize = (
      canvas: HTMLCanvasElement,
      aspectRatio: number,
      maxWidth: number = 200,
    ) => {
      canvas.width = maxWidth;
      canvas.height = Math.round(maxWidth / aspectRatio);
    };

    const calculateVerticalSizes = (
      outputAspectRatio: number,
      inputAspectRatio: number,
      containerHeight: number,
      maxWidth: number,
    ) => {
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

      return {
        output: { width: outputWidth, height: outputHeight },
        input: { width: inputWidth, height: inputHeight },
      };
    };

    if (outputVideo.readyState < 2) {
      const checkVideoReady = setTimeout(() => {
        if (outputVideo.readyState < 2) {
          toast("Can't create clip", {
            description:
              "Output video is not ready yet. Please try again in a moment.",
          });
          onClose();
        } else {
          captureFrames();
        }
      }, 1000);

      return () => clearTimeout(checkVideoReady);
    }

    const captureFrames = () => {
      try {
        const outputAspectRatio =
          outputVideo.videoWidth / outputVideo.videoHeight;
        const inputAspectRatio = inputVideo.videoWidth / inputVideo.videoHeight;

        if (outputVideo.readyState < 2 || outputVideo.videoWidth === 0) {
          throw new Error("Output video is not ready yet");
        }

        if (horizontalOutputRef.current) {
          const ctx = horizontalOutputRef.current.getContext("2d");
          if (!ctx) throw new Error("Could not get canvas context");

          setCanvasSize(horizontalOutputRef.current, outputAspectRatio, 240);
          ctx.drawImage(
            outputVideo,
            0,
            0,
            horizontalOutputRef.current.width,
            horizontalOutputRef.current.height,
          );
        }

        if (horizontalInputRef.current && inputVideo.readyState >= 2) {
          setCanvasSize(horizontalInputRef.current, inputAspectRatio, 60);
          const ctx = horizontalInputRef.current.getContext("2d");
          if (ctx) {
            ctx.drawImage(
              inputVideo,
              0,
              0,
              horizontalInputRef.current.width,
              horizontalInputRef.current.height,
            );
          }
        }

        const containerHeight = 180;
        const maxWidth = 200;

        const verticalDimensions = calculateVerticalSizes(
          outputAspectRatio,
          inputAspectRatio,
          containerHeight,
          maxWidth,
        );

        setVerticalOutputDimensions(verticalDimensions.output);
        setVerticalInputDimensions(verticalDimensions.input);

        if (verticalOutputRef.current && outputVideo.readyState >= 2) {
          verticalOutputRef.current.width = verticalDimensions.output.width;
          verticalOutputRef.current.height = verticalDimensions.output.height;

          const ctx = verticalOutputRef.current.getContext("2d");
          if (ctx) {
            ctx.drawImage(
              outputVideo,
              0,
              0,
              verticalOutputRef.current.width,
              verticalOutputRef.current.height,
            );
          }
        }

        if (verticalInputRef.current && inputVideo.readyState >= 2) {
          verticalInputRef.current.width = verticalDimensions.input.width;
          verticalInputRef.current.height = verticalDimensions.input.height;

          const ctx = verticalInputRef.current.getContext("2d");
          if (ctx) {
            ctx.drawImage(
              inputVideo,
              0,
              0,
              verticalInputRef.current.width,
              verticalInputRef.current.height,
            );
          }
        }

        if (outputOnlyRef.current && outputVideo.readyState >= 2) {
          setCanvasSize(outputOnlyRef.current, outputAspectRatio, 240);
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
    };

    const timeoutId = setTimeout(captureFrames, 100);

    return () => {
      clearTimeout(timeoutId);
    };
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
