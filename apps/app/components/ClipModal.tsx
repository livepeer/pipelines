import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Button } from "@repo/design-system/components/ui/button";
import { Separator } from "@repo/design-system/components/ui/separator";
import { Switch } from "@repo/design-system/components/ui/switch";
import { TooltipProvider } from "@repo/design-system/components/ui/tooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { usePhoneRotation } from "@/hooks/usePhoneRotation";

interface ClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  clipUrl: string | null;
  clipFilename: string | null;
}

/**
 * TODOS:
 * 1. Rename button from Download to Continue once the APIs are ready for clip sharing
 * 2. Enable Switch toggle and upload logic to post to leaderboard
 */
export function ClipModal({
  isOpen,
  onClose,
  clipUrl,
  clipFilename,
}: ClipModalProps) {
  const isRotating = usePhoneRotation();

  const handleDownload = () => {
    if (clipUrl && clipFilename) {
      const downloadLink = document.createElement("a");
      downloadLink.href = clipUrl;
      downloadLink.download = clipFilename;
      document.body.appendChild(downloadLink);
      downloadLink.click();

      setTimeout(() => {
        document.body.removeChild(downloadLink);
      }, 100);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isRotating) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="h-fit max-h-[90vh] max-w-[55vh] mx-auto overflow-y-auto rounded-xl">
        <DialogHeader className="flex items-center">
          <DialogTitle className="text-2xl">Clip Summary</DialogTitle>
          <DialogDescription className="font-light text-center">
            Post the clip to Daydream leaderboard, download or share with your
            friends
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-2" />

        <div className="flex justify-center">
          {clipUrl && (
            <video
              src={clipUrl}
              autoPlay
              loop
              muted={false}
              playsInline
              controls
              className="w-full sm:h-[50dvh] aspect-square rounded-md"
            />
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col items-start">
            <div className="text-sm font-medium">Post to Leaderboard</div>
            <div className="text-sm text-muted-foreground font-light">
              This clip will be displayed in Daydream Leaderboard
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="w-4 h-4 hover:cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  This feature is not available yet. We shall roll out soon!
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Switch disabled defaultChecked={false} />
          </div>
        </div>

        <Separator className="my-2" />

        <div className="w-full">
          <Button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 rounded-md h-[46px]"
          >
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
