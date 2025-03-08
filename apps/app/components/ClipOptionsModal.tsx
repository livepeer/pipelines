import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/design-system/components/ui/dialog";
import { toast } from 'sonner';

export type ClipRecordingMode = 'horizontal' | 'vertical' | 'output-only';

interface ClipOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClip: (mode: ClipRecordingMode) => void;
}

export function ClipOptionsModal({
  isOpen,
  onClose,
  onCreateClip
}: ClipOptionsModalProps) {
  const horizontalOutputRef = useRef<HTMLCanvasElement>(null);
  const horizontalInputRef = useRef<HTMLCanvasElement>(null);
  const verticalOutputRef = useRef<HTMLCanvasElement>(null);
  const verticalInputRef = useRef<HTMLCanvasElement>(null);
  const outputOnlyRef = useRef<HTMLCanvasElement>(null);
  
  const [verticalOutputDimensions, setVerticalOutputDimensions] = useState({ width: 0, height: 0 });
  const [verticalInputDimensions, setVerticalInputDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    if (!isOpen) return;
    
    const videos = document.querySelectorAll('video');
    if (videos.length < 2) {
      toast("Can't create clip", {
        description: "Video elements not found"
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
            description: "Output video is not ready yet. Please try again in a moment."
          });
          onClose();
        } else {
          captureFrames();
        }
      }, 1000);
      
      return () => clearTimeout(checkVideoReady);
    }
    
    const outputAspectRatio = outputVideo.videoWidth / outputVideo.videoHeight;
    const inputAspectRatio = inputVideo.videoWidth / inputVideo.videoHeight;
    
    const setCanvasSize = (canvas: HTMLCanvasElement, aspectRatio: number, maxWidth: number = 200) => {
      canvas.width = maxWidth;
      canvas.height = Math.round(maxWidth / aspectRatio);
    };
    
    const calculateVerticalSizes = (
      outputAspectRatio: number,
      inputAspectRatio: number,
      containerHeight: number,
      maxWidth: number
    ) => {
      const totalAspectUnits = 1/outputAspectRatio + 1/inputAspectRatio;
      const outputHeightRatio = (1/outputAspectRatio) / totalAspectUnits;
      
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
        input: { width: inputWidth, height: inputHeight }
      };
    };
    
    const captureFrames = () => {
      if (horizontalOutputRef.current) {
        const ctx = horizontalOutputRef.current.getContext('2d');
        if (!ctx || outputVideo.readyState < 2 || outputVideo.videoWidth === 0) {
          toast("Can't create clip", {
            description: "Output video is not ready yet. Please try again in a moment."
          });
          onClose();
          return;
        }
        
        setCanvasSize(horizontalOutputRef.current, outputAspectRatio, 240);
        ctx.drawImage(
          outputVideo, 
          0, 0, 
          horizontalOutputRef.current.width, 
          horizontalOutputRef.current.height
        );
      }
      
      if (horizontalInputRef.current && inputVideo.readyState >= 2) {
        setCanvasSize(horizontalInputRef.current, inputAspectRatio, 60);
        const ctx = horizontalInputRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            inputVideo, 
            0, 0, 
            horizontalInputRef.current.width, 
            horizontalInputRef.current.height
          );
        }
      }
      
      const containerHeight = 180;
      const maxWidth = 200;
      
      const verticalDimensions = calculateVerticalSizes(
        outputAspectRatio,
        inputAspectRatio,
        containerHeight,
        maxWidth
      );
      
      setVerticalOutputDimensions(verticalDimensions.output);
      setVerticalInputDimensions(verticalDimensions.input);
      
      if (verticalOutputRef.current && outputVideo.readyState >= 2) {
        verticalOutputRef.current.width = verticalDimensions.output.width;
        verticalOutputRef.current.height = verticalDimensions.output.height;
        
        const ctx = verticalOutputRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            outputVideo, 
            0, 0, 
            verticalOutputRef.current.width, 
            verticalOutputRef.current.height
          );
        }
      }
      
      if (verticalInputRef.current && inputVideo.readyState >= 2) {
        verticalInputRef.current.width = verticalDimensions.input.width;
        verticalInputRef.current.height = verticalDimensions.input.height;
        
        const ctx = verticalInputRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            inputVideo, 
            0, 0, 
            verticalInputRef.current.width, 
            verticalInputRef.current.height
          );
        }
      }
      
      if (outputOnlyRef.current && outputVideo.readyState >= 2) {
        setCanvasSize(outputOnlyRef.current, outputAspectRatio, 240);
        const ctx = outputOnlyRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            outputVideo, 
            0, 0, 
            outputOnlyRef.current.width, 
            outputOnlyRef.current.height
          );
        }
      }
    };
    
    const timeoutId = setTimeout(captureFrames, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isOpen, onClose]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] mx-auto sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader className="flex flex-col items-center justify-center">
          <DialogTitle className="text-center w-full">Choose your clip layout</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 mb-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div 
            className="flex flex-col gap-2 border rounded-md p-3 bg-black text-white hover:bg-black/80 cursor-pointer transition-colors"
            onClick={() => onCreateClip('horizontal')}
          >
            <div className="font-medium text-center">Combined</div>
            
            <div className="relative bg-black rounded-md p-2 flex items-center justify-center h-48">
              <canvas 
                ref={horizontalOutputRef}
                className="max-w-full max-h-full rounded-md bg-black"
              />
              
              <div className="absolute bottom-4 right-4 max-w-[25%] overflow-hidden rounded-sm">
                <canvas 
                  ref={horizontalInputRef}
                  className="w-full h-full bg-black"
                />
              </div>
            </div>
          </div>
          
          <div 
            className="flex flex-col gap-2 border rounded-md p-3 bg-black text-white hover:bg-black/80 cursor-pointer transition-colors"
            onClick={() => onCreateClip('vertical')}
          >
            <div className="font-medium text-center">Vertical</div>
            
            <div className="bg-black rounded-md p-2 h-48 flex items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <canvas 
                  ref={verticalOutputRef}
                  className="rounded-md bg-black"
                  style={{
                    width: `${verticalOutputDimensions.width}px`,
                    height: `${verticalOutputDimensions.height}px`
                  }}
                />
                
                <canvas 
                  ref={verticalInputRef}
                  className="rounded-md bg-black"
                  style={{
                    width: `${verticalInputDimensions.width}px`,
                    height: `${verticalInputDimensions.height}px`
                  }}
                />
              </div>
            </div>
          </div>
          
          <div 
            className="flex flex-col gap-2 border rounded-md p-3 bg-black text-white hover:bg-black/80 cursor-pointer transition-colors"
            onClick={() => onCreateClip('output-only')}
          >
            <div className="font-medium text-center">Output Only</div>
            
            <div className="bg-black p-2 rounded-md flex items-center justify-center h-48">
              <canvas 
                ref={outputOnlyRef}
                className="max-w-full max-h-full rounded-md bg-black"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 