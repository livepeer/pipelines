import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export const CLIP_DURATION = 10000;

const INPUT_DELAY = 1000; // 1 second delay 
// // increase this to sync the input and output stream 
// // TODO: make this dynamic based on the input video's frame rate or evaluate better
const FRAME_RATE = 30; // 30fps
const BUFFER_SIZE = Math.ceil((INPUT_DELAY / 1000) * FRAME_RATE);

export const useVideoClip = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [clipFilename, setClipFilename] = useState<string | null>(null);
  const [showClipModal, setShowClipModal] = useState(false);

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

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
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

  const recordClip = async () => {
    if (isRecording) return;
    
    const videos = document.querySelectorAll('video');
    
    if (videos.length < 2) {
      toast("Couldn't find both video elements", {
        description: "Need two video elements for recording"
      });
      return;
    }
    
    const outputVideo = videos[0] as HTMLVideoElement;
    const inputVideo = videos[1] as HTMLVideoElement;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const outputWidth = outputVideo.videoWidth;
    const outputHeight = outputVideo.videoHeight;
    const inputWidth = inputVideo.videoWidth;
    const inputHeight = inputVideo.videoHeight;
    
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    
    const inputFrameBuffer: ImageData[] = [];
    
    const inputCanvas = document.createElement('canvas');
    const inputCtx = inputCanvas.getContext('2d');
    inputCanvas.width = inputWidth;
    inputCanvas.height = inputHeight;
    
    const mimeTypes = [
      'video/mp4',
      'video/mp4; codecs=h264',
      'video/webm; codecs=h264', 
      'video/webm; codecs=vp9'
    ];
    
    const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
    const fileExtension = supportedMimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
    
    const stream = canvas.captureStream(FRAME_RATE);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: supportedMimeType });
    
    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: supportedMimeType });
      
      const url = URL.createObjectURL(blob);
      const filename = `livepeer-clip-${new Date().toISOString()}.${fileExtension}`;
      
      setClipUrl(url);
      setClipFilename(filename);
      setShowClipModal(true);
      
      setIsRecording(false);
      setProgress(0);
      toast("Clip created successfully", {
        description: "Your clip is ready to preview"
      });
    };
    
    let isDrawing = true;
    let animationFrameId: number;
    
    const captureInputFrame = () => {
      if (!inputCtx) return null;
      
      inputCtx.drawImage(inputVideo, 0, 0, inputWidth, inputHeight);
      
      const frameData = inputCtx.getImageData(0, 0, inputWidth, inputHeight);
      
      inputFrameBuffer.push(frameData);
      
      if (inputFrameBuffer.length > BUFFER_SIZE) {
        inputFrameBuffer.shift(); // Remove oldest frame
      }
      
      return frameData;
    };
    
    const prefillBuffer = () => {
      /*toast(`Preparing to record (${INPUT_DELAY/1000}s delay sync)...`, {
        description: "Syncing input and output streams"
      });*/
      toast("Recording clip...")
      
      return new Promise<void>((resolve) => {
        const fillInterval = setInterval(() => {
          captureInputFrame();
          
          if (inputFrameBuffer.length >= BUFFER_SIZE) {
            clearInterval(fillInterval);
            resolve();
          }
        }, 1000 / FRAME_RATE);
      });
    };
    
    await prefillBuffer();
    
    const drawFrame = () => {
      if (!ctx || !isDrawing) return;
      
      captureInputFrame();
      
      const pipSize = 0.25; // Size of the PiP relative to canvas width
      const margin = 16; // Margin in pixels
      const borderRadius = 12; // Border radius for the PiP
      
      const pipWidth = Math.floor(canvas.width * pipSize);
      const pipHeight = Math.floor((inputHeight / inputWidth) * pipWidth);
      
      const pipX = canvas.width - pipWidth - margin;
      const pipY = canvas.height - pipHeight - margin;
      
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(
        outputVideo,
        0, 0,
        canvas.width, canvas.height
      );
      
      if (inputFrameBuffer.length > 0 && inputCtx) {
        ctx.save();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        drawRoundedRect(ctx, pipX - 2, pipY - 2, pipWidth + 4, pipHeight + 4, borderRadius);
        ctx.fill();
        
        drawRoundedRect(ctx, pipX, pipY, pipWidth, pipHeight, borderRadius - 2);
        ctx.clip();
        
        const delayedFrame = inputFrameBuffer[0];
        
        inputCtx.putImageData(delayedFrame, 0, 0);
        
        ctx.drawImage(
          inputCanvas,
          pipX, pipY,
          pipWidth, pipHeight
        );
        
        ctx.restore();
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, pipX, pipY, pipWidth, pipHeight, borderRadius - 2);
        ctx.stroke();
      }
      
      const watermarkText = "daydream.live";
      const watermarkPadding = 10;
      const watermarkHeight = 36;
      
      ctx.font = "bold 20px Inter, system-ui, sans-serif";
      const watermarkWidth = ctx.measureText(watermarkText).width + (watermarkPadding * 2);
      
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.roundRect(
        margin, 
        canvas.height - margin - watermarkHeight, 
        watermarkWidth, 
        watermarkHeight, 
        8
      );
      ctx.fill();
      
      ctx.fillStyle = "white";
      ctx.textBaseline = "middle";
      ctx.fillText(
        watermarkText, 
        margin + watermarkPadding, 
        canvas.height - margin - (watermarkHeight / 2) // Vertical center in the background box
      );
      
      if (isDrawing) {
        animationFrameId = requestAnimationFrame(drawFrame);
      }
    };
    
    setIsRecording(true);
    setProgress(0);
    
    mediaRecorder.start(1000);
    
    drawFrame();
    
    const startTime = Date.now();
    const duration = CLIP_DURATION; 
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(newProgress);
      
      if (elapsed >= duration) {
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
    recordClip, 
    isRecording, 
    progress, 
    clipUrl, 
    clipFilename, 
    showClipModal, 
    closeClipModal,
    cleanupClipUrl
  };
}; 