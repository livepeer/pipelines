import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { ClipData } from "./types";
import { useRouter } from "next/navigation";
import track from "@/lib/track";
import { storeClip } from "@/lib/clipStorage";
import { cn } from "@repo/design-system/lib/utils";
import { Separator } from "@repo/design-system/components/ui/separator";
import { Button } from "@repo/design-system/components/ui/button";

interface GuestModeContentProps {
  clipData: ClipData;
  onClose: () => void;
}

export function GuestModeContent({ clipData, onClose }: GuestModeContentProps) {
  const router = useRouter();

  const handleJoinDaydream = async () => {
    track("guest_join_from_clip_modal", {});
    localStorage.setItem("daydream_from_guest_experience", "true");

    if (clipData.lastSubmittedPrompt) {
      localStorage.setItem(
        "daydream_pending_clip_prompt",
        clipData.lastSubmittedPrompt,
      );
    }

    if (clipData.clipUrl && clipData.thumbnailUrl && clipData.clipFilename) {
      try {
        const [clipResponse, thumbnailResponse] = await Promise.all([
          fetch(clipData.clipUrl),
          fetch(clipData.thumbnailUrl),
        ]);

        if (!clipResponse.ok || !thumbnailResponse.ok) {
          throw new Error("Failed to fetch clip or thumbnail data");
        }

        const [clipBlob, thumbnailBlob] = await Promise.all([
          clipResponse.blob(),
          thumbnailResponse.blob(),
        ]);

        await storeClip(
          clipBlob,
          clipData.clipFilename,
          thumbnailBlob,
          clipData.lastSubmittedPrompt,
          clipData.recordingMode,
        );
        console.log(
          "Clip, thumbnail, and prompt stored successfully in IndexedDB",
        );
      } catch (error) {
        console.error("Error processing or storing clip data:", error);
      }
    } else {
      console.warn(
        "Missing clipUrl, thumbnailUrl, or clipFilename. Cannot store clip.",
      );
    }

    onClose();
    router.push("/create");
  };

  return (
    <DialogContent className="max-w-[calc(100%-2rem)] mx-auto sm:max-w-[600px] p-6 sm:p-8 rounded-xl">
      <div className="flex justify-center mb-4">
        <Logo className="w-[120px]" />
      </div>

      <DialogHeader className="text-center mb-4">
        <DialogTitle className="text-2xl font-semibold mb-2 text-center">
          Create Your Free Daydream Account
        </DialogTitle>
        <DialogDescription className="text-base text-center">
          One quick step before sharing your amazing creation
        </DialogDescription>
      </DialogHeader>

      <div
        className={cn(
          "mt-4 mb-6 flex justify-center",
          clipData.recordingMode === "vertical" ? "bg-white" : "bg-black",
        )}
      >
        {clipData.clipUrl && (
          <video
            src={clipData.clipUrl}
            autoPlay
            loop
            muted={false}
            playsInline
            controls
            poster={clipData.thumbnailUrl || undefined}
            className="w-full max-h-[50vh] object-contain rounded-md"
          />
        )}
      </div>

      <Separator className="my-2" />

      <div className="w-full mt-4">
        <Button
          onClick={handleJoinDaydream}
          className="w-full flex items-center justify-center gap-2 rounded-md py-6"
        >
          Join Daydream Now
        </Button>
      </div>
    </DialogContent>
  );
}

const Logo = ({ className }: { className?: string }) => (
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
