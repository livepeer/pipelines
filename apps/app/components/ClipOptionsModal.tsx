import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/design-system/components/ui/dialog";
import { Button } from "@repo/design-system/components/ui/button";
import { Layout, Layers } from "lucide-react";

export type ClipRecordingMode = 'both' | 'output-only';

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
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] mx-auto sm:max-w-[400px] max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Select Clip Layout</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div 
            className="flex flex-col items-center gap-2 border rounded-md p-4 hover:bg-gray-100 cursor-pointer transition-colors"
            onClick={() => onCreateClip('both')}
          >
            <Layers className="h-8 w-8 text-gray-700" />
            <div className="font-medium">Input + Output</div>
            <div className="text-sm text-gray-500 text-center">Record both input stream and output video</div>
          </div>
          
          <div 
            className="flex flex-col items-center gap-2 border rounded-md p-4 hover:bg-gray-100 cursor-pointer transition-colors"
            onClick={() => onCreateClip('output-only')}
          >
            <Layout className="h-8 w-8 text-gray-700" />
            <div className="font-medium">Output Only</div>
            <div className="text-sm text-gray-500 text-center">Record only the output video</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 