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
import { usePhoneRotation } from "@/hooks/usePhoneRotation";
import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import track from "@/lib/track";
import { cn } from "@repo/design-system/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
  <svg
    width="23"
    height="25"
    className={cn("fill-foreground w-4 h-4", className)}
    viewBox="0 0 23 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.06583e-07 4.24978L0 0H4.73887V4.24978H2.06583e-07Z"
      fill="inherit"
    />
    <path
      d="M8.70093 9.23462V4.98486H13.4398V9.23462H8.70093Z"
      fill="inherit"
    />
    <path
      d="M17.4023 14.1319V9.88208H22.1412V14.1319H17.4023Z"
      fill="inherit"
    />
    <path
      d="M8.70093 19.0916V14.8418H13.4398V19.0916H8.70093Z"
      fill="inherit"
    />
    <path
      d="M2.06583e-07 24.0523L0 19.8025H4.73887V24.0523H2.06583e-07Z"
      fill="inherit"
    />
    <path
      d="M2.06583e-07 14.1319L0 9.88208H4.73887V14.1319H2.06583e-07Z"
      fill="inherit"
    />
  </svg>
);
interface ClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  clipUrl: string | null;
  clipFilename: string | null;
  isGuestMode?: boolean;
}

/**
 * TODOS:
 * 1. Rename button from Download to Continue once the APIs are ready for clip sharing
 * 2. Enable Switch toggle and upload logic to post to leaderboard
 * 3. Add a button to share the clip to the leaderboard
 */
export function ClipModal({
  isOpen,
  onClose,
  clipUrl,
  clipFilename,
  isGuestMode = false,
}: ClipModalProps) {
  const isRotating = usePhoneRotation();
  const router = useRouter();

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

  const handleJoinDaydream = () => {
    track("guest_join_from_clip_modal", {});
    localStorage.setItem("daydream_from_guest_experience", "true");
    onClose();
    router.push("/create");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] mx-auto sm:max-w-[600px] p-6 sm:p-8 rounded-xl">
        <div className="flex justify-center mb-4">
          <Logo className="w-[120px]" />
        </div>

        <DialogHeader className="text-center mb-4">
          {isGuestMode ? (
            <>
              <DialogTitle className="text-2xl font-semibold mb-2 text-center">
                Create a free Daydream account
              </DialogTitle>
              <DialogDescription className="text-base text-center">
                Before you share your clip you need to create a free account
              </DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle className="text-2xl font-semibold text-center">
                Your Clip is ready!
              </DialogTitle>
              <DialogDescription className="font-light text-center">
                Post the clip to Daydream leaderboard, download or share with
                your friends
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        <div className="mt-4 mb-6 flex justify-center">
          {clipUrl && (
            <video
              src={clipUrl}
              autoPlay
              loop
              muted={false}
              playsInline
              controls
              className="w-full max-h-[50vh] object-contain rounded-md"
            />
          )}
        </div>

        {/* <div className="flex items-center justify-between mt-2">
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
        </div> */}

        <Separator className="my-2" />

        <div className="w-full mt-4">
          {isGuestMode ? (
            <Button
              onClick={handleJoinDaydream}
              className="w-full flex items-center justify-center gap-2 rounded-md py-6"
            >
              Join Daydream
            </Button>
          ) : (
            <Button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 rounded-md py-6"
            >
              <Download className="h-4 w-4" />
              Download Clip
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
