import { useState, useCallback } from "react";
import { toast } from "sonner";

export type ClipRecordingMode = "horizontal" | "vertical" | "output-only";

export const CLIP_DURATION = 15000;

const FRAME_RATE = 30;
const INPUT_DELAY = 1000; // 1 second delay for input video - increase or decreas to sync
const BUFFER_SIZE = Math.ceil((INPUT_DELAY / 1000) * FRAME_RATE);

export const useVideoClip = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [clipFilename, setClipFilename] = useState<string | null>(null);
  const [showClipModal, setShowClipModal] = useState(false);

  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const cleanupClipUrl = () => {
    if (clipUrl) {
      URL.revokeObjectURL(clipUrl);
      setClipUrl(null);
      setClipFilename(null);
    }
  };

  const closeClipModal = () => {
    setShowClipModal(false);
  };

  const closeOptionsModal = () => {
    setShowOptionsModal(false);
  };

  const showRecordingOptions = () => {
    setShowOptionsModal(true);
  };

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const getSupportedVideoFormat = () => {
    const mimeTypes = [
      "video/mp4",
      "video/mp4; codecs=h264",
      "video/webm; codecs=h264",
      "video/webm; codecs=vp9",
    ];

    const supportedType =
      mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) ||
      "video/webm";
    const fileExt = supportedType.startsWith("video/mp4") ? "mp4" : "webm";

    return { mimeType: supportedType, extension: fileExt };
  };

  const setupCanvasForMode = (
    mode: ClipRecordingMode,
    outputVideo: HTMLVideoElement,
    inputVideo: HTMLVideoElement,
  ) => {
    const canvas = document.createElement("canvas");

    if (mode === "vertical") {
      const outputAspectRatio =
        outputVideo.videoWidth / outputVideo.videoHeight;
      const inputAspectRatio = inputVideo.videoWidth / inputVideo.videoHeight;

      const canvasWidth = Math.max(
        outputVideo.videoWidth,
        inputVideo.videoWidth,
      );
      let outputHeight = Math.round(canvasWidth / outputAspectRatio);
      let inputHeight = Math.round(canvasWidth / inputAspectRatio);

      const totalHeight = outputHeight + inputHeight;
      const maxHeight = 1080;

      if (totalHeight > maxHeight) {
        const scale = maxHeight / totalHeight;
        outputHeight = Math.round(outputHeight * scale);
        inputHeight = Math.round(inputHeight * scale);
        canvas.width = Math.round(canvasWidth * scale);
      } else {
        canvas.width = canvasWidth;
      }

      canvas.height = outputHeight + inputHeight;
    } else {
      canvas.width = outputVideo.videoWidth;
      canvas.height = outputVideo.videoHeight;
    }

    return canvas;
  };

  const recordClip = async (mode: ClipRecordingMode = "horizontal") => {
    if (isRecording) return;
    setShowOptionsModal(false);

    const videos = document.querySelectorAll("video");
    if (videos.length < 2) {
      toast("Couldn't find both video elements", {
        description: "Need two video elements for recording",
      });
      return;
    }

    const outputVideo = videos[0] as HTMLVideoElement;
    const inputVideo = videos[1] as HTMLVideoElement;
    const canvas = setupCanvasForMode(mode, outputVideo, inputVideo);
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      toast("Couldn't initialize recording canvas", {
        description: "Please try again",
      });
      return;
    }

    const inputFrameBuffer: ImageData[] = [];
    const inputCanvas = document.createElement("canvas");
    const inputCtx = inputCanvas.getContext("2d");

    inputCanvas.width = inputVideo.videoWidth;
    inputCanvas.height = inputVideo.videoHeight;

    const { mimeType, extension } = getSupportedVideoFormat();
    const stream = canvas.captureStream(FRAME_RATE);
    const mediaRecorder = new MediaRecorder(stream, { mimeType });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const filename = `daydream-clip-${new Date().toISOString()}.${extension}`;

      setClipUrl(url);
      setClipFilename(filename);
      setShowClipModal(true);
      setIsRecording(false);
      setProgress(0);

      toast("Clip created successfully", {
        description: "Your clip is ready to preview",
      });
    };

    let isDrawing = true;
    let animationFrameId: number;

    const captureInputFrame = () => {
      if (!inputCtx || mode === "output-only") return null;

      inputCtx.drawImage(
        inputVideo,
        0,
        0,
        inputVideo.videoWidth,
        inputVideo.videoHeight,
      );
      const frameData = inputCtx.getImageData(
        0,
        0,
        inputVideo.videoWidth,
        inputVideo.videoHeight,
      );

      if (mode === "horizontal") {
        inputFrameBuffer.push(frameData);
        if (inputFrameBuffer.length > BUFFER_SIZE) inputFrameBuffer.shift();
      }

      return frameData;
    };

    const prefillBuffer = async () => {
      toast("Recording clip...");

      if (mode !== "horizontal") return;

      return new Promise<void>(resolve => {
        const fillInterval = setInterval(() => {
          captureInputFrame();

          if (inputFrameBuffer.length >= BUFFER_SIZE) {
            clearInterval(fillInterval);
            resolve();
          }
        }, 1000 / FRAME_RATE);
      });
    };

    const drawHorizontalMode = () => {
      ctx.drawImage(outputVideo, 0, 0, canvas.width, canvas.height);

      if (inputFrameBuffer.length > 0 && inputCtx) {
        const margin = 16;
        const pipSize = 0.25;
        const borderRadius = 12;

        const pipWidth = Math.floor(canvas.width * pipSize);
        const pipHeight = Math.floor(
          (inputVideo.videoHeight / inputVideo.videoWidth) * pipWidth,
        );

        const pipX = canvas.width - pipWidth - margin;
        const pipY = canvas.height - pipHeight - margin;

        ctx.save();

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        drawRoundedRect(
          ctx,
          pipX - 2,
          pipY - 2,
          pipWidth + 4,
          pipHeight + 4,
          borderRadius,
        );
        ctx.fill();

        drawRoundedRect(ctx, pipX, pipY, pipWidth, pipHeight, borderRadius - 2);
        ctx.clip();

        const delayedFrame = inputFrameBuffer[0];
        inputFrameBuffer.shift();
        captureInputFrame();

        inputCtx.putImageData(delayedFrame, 0, 0);
        ctx.drawImage(inputCanvas, pipX, pipY, pipWidth, pipHeight);

        ctx.restore();
      }
    };

    const drawVerticalMode = () => {
      const outputAspectRatio =
        outputVideo.videoWidth / outputVideo.videoHeight;
      const inputAspectRatio = inputVideo.videoWidth / inputVideo.videoHeight;

      const outputHeight = Math.round(canvas.width / outputAspectRatio);
      const inputHeight = Math.round(canvas.width / inputAspectRatio);

      ctx.drawImage(outputVideo, 0, 0, canvas.width, outputHeight);
      ctx.drawImage(inputVideo, 0, outputHeight, canvas.width, inputHeight);
    };

    const drawWatermark = () => {
      const margin = 16;
      const watermarkText = "daydream.live";
      const watermarkPadding = 4;
      const watermarkHeight = 16;
      const bottomMargin = 8;

      ctx.font = "bold 10px Inter, system-ui, sans-serif";
      const watermarkWidth =
        ctx.measureText(watermarkText).width + watermarkPadding * 2;

      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.roundRect(
        margin,
        canvas.height - bottomMargin - watermarkHeight,
        watermarkWidth,
        watermarkHeight,
        3,
      );
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.textBaseline = "middle";
      ctx.fillText(
        watermarkText,
        margin + watermarkPadding,
        canvas.height - bottomMargin - watermarkHeight / 2,
      );
    };

    const drawFrame = () => {
      if (!ctx || !isDrawing) return;

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (mode === "output-only") {
        ctx.drawImage(outputVideo, 0, 0, canvas.width, canvas.height);
      } else if (mode === "horizontal") {
        drawHorizontalMode();
      } else if (mode === "vertical") {
        drawVerticalMode();
      }

      drawWatermark();

      if (isDrawing) {
        animationFrameId = requestAnimationFrame(drawFrame);
      }
    };

    await prefillBuffer();

    setIsRecording(true);
    setProgress(0);
    mediaRecorder.start(1000);
    drawFrame();

    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / CLIP_DURATION) * 100);
      setProgress(newProgress);

      if (elapsed >= CLIP_DURATION) {
        clearInterval(progressInterval);
      }
    }, 100);

    setTimeout(() => {
      isDrawing = false;
      cancelAnimationFrame(animationFrameId);
      clearInterval(progressInterval);
      mediaRecorder.stop();
    }, CLIP_DURATION);
  };

  return {
    showRecordingOptions,
    recordClip,
    isRecording,
    progress,
    clipUrl,
    clipFilename,
    showClipModal,
    closeClipModal,
    cleanupClipUrl,
    showOptionsModal,
    closeOptionsModal,
  };
};
