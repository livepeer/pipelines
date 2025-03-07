import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/design-system/components/ui/dialog";
import { Button } from "@repo/design-system/components/ui/button";
import { Download } from "lucide-react";

interface ClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  clipUrl: string | null;
  clipFilename: string | null;
}

export function ClipModal({
  isOpen,
  onClose,
  clipUrl,
  clipFilename
}: ClipModalProps) {
  const handleDownload = () => {
    if (clipUrl && clipFilename) {
      const a = document.createElement('a');
      a.href = clipUrl;
      a.download = clipFilename;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] mx-auto sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Your Clip is ready!</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 mb-4">
          {clipUrl && (
            <video 
              src={clipUrl}
              autoPlay
              loop
              muted={false}
              playsInline
              className="w-full rounded-md"
            />
          )}
        </div>
        
        <div className="w-full mt-2">
          <Button 
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 rounded-md"
          >
            <Download className="h-4 w-4" />
            Download Clip
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 