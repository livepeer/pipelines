import React, { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const QuickviewVideo: React.FC<{
  children: React.ReactNode;
  clipId: string;
}> = ({ children, clipId }) => {
  const [isOverlayMode, setIsOverlayMode] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleClose = () => {
    setIsOverlayMode(false);
    setIsOverlayOpen(false);
    setIsPreviewOpen(false);
  };

  return (
    <>
      <Dialog open={isOverlayMode ? isOverlayOpen : isPreviewOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent
          className={cn(
            "h-screen max-w-screen border-none bg-transparent shadow-none pt-12 pb-4 backdrop-filter backdrop-blur-[3px] flex justify-center items-center",
            isOverlayMode &&
              "bg-transparent backdrop-blur-none border-none shadow-none",
          )}
          overlayClassName={cn(
            "bg-white sm:bg-[rgba(255,255,255,0.90)]",
            isOverlayMode && "bg-transparent",
          )}
          displayCloseButton={false}
          onClick={isOverlayMode ? undefined : handleClose}
          onOpenAutoFocus={e => {
            e.preventDefault();
          }}
          key={clipId}
        >
          {!isOverlayMode && (
            <button
              className="absolute top-4 right-4 z-[999] flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-[#09090B] outline-none hover:bg-zinc-200 transition-colors"
              onClick={e => {
                e.stopPropagation();
                handleClose();
              }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div
            className="max-h-[90vh] max-w-2xl w-full aspect-video max-w-[73vh]"
            onClick={e => e.stopPropagation()}
          ></div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickviewVideo;
