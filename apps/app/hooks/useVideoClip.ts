import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const CLIP_DURATION = 10000;

export const useVideoClip = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);

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
    
    canvas.width = Math.max(outputWidth, inputWidth);
    canvas.height = outputHeight + inputHeight;
    
    const mimeTypes = [
      'video/mp4',
      'video/mp4; codecs=h264',
      'video/webm; codecs=h264', 
      'video/webm; codecs=vp9'
    ];
    
    const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
    const fileExtension = supportedMimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
    
    const stream = canvas.captureStream(30); // 30fps
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
      const a = document.createElement('a');
      a.href = url;
      a.download = `livepeer-clip-${new Date().toISOString()}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      setIsRecording(false);
      setProgress(0);
      toast("Clip created successfully", {
        description: "Your clip has been downloaded"
      });
    };
    
    let isDrawing = true;
    let animationFrameId: number;
    
    const drawFrame = () => {
      if (!ctx || !isDrawing) return;
      
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(
        outputVideo,
        (canvas.width - outputWidth) / 2, 0,
        outputWidth, outputHeight
      );
      
      ctx.drawImage(
        inputVideo,
        (canvas.width - inputWidth) / 2, outputHeight,
        inputWidth, inputHeight
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

  return { recordClip, isRecording, progress };
}; 