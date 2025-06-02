import React, { useEffect, useState } from "react";
import { Dialog } from "@repo/design-system/components/ui/dialog";
import { usePhoneRotation } from "@/hooks/usePhoneRotation";
import { ClipSummaryContent } from "./ClipSummaryContent";
import ClipShareContent from "./ClipShareContent";
import { ClipData } from "./types";
import { GuestModeContent } from "./GuestModeContent";
import { ClipRecordingMode } from "@/hooks/useVideoClip";

interface ClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  clipUrl: string | null;
  clipFilename: string | null;
  thumbnailUrl?: string | null;
  lastSubmittedPrompt?: string | null;
  isGuestMode?: boolean;
  recordingMode?: ClipRecordingMode;
}

type ClipStep = "summary" | "share";

export function ClipModal({
  isOpen,
  onClose,
  clipUrl,
  clipFilename,
  thumbnailUrl = null,
  lastSubmittedPrompt = null,
  isGuestMode = false,
  recordingMode = "output-only",
}: ClipModalProps) {
  const isRotating = usePhoneRotation();
  const [clipStep, setClipStep] = useState<ClipStep>("summary");
  const [clipData, setClipData] = useState<ClipData>({
    clipUrl: clipUrl || "",
    clipFilename: clipFilename || "",
    serverClipUrl: "",
    thumbnailUrl: thumbnailUrl || null,
    lastSubmittedPrompt: lastSubmittedPrompt || undefined,
    recordingMode,
  });

  // Reset the clip data when it changes.
  useEffect(() => {
    if (clipUrl && clipFilename) {
      setClipData(state => ({
        ...state,
        clipUrl,
        clipFilename,
        thumbnailUrl,
        lastSubmittedPrompt: lastSubmittedPrompt || undefined,
        recordingMode,
      }));
    }
  }, [clipUrl, clipFilename, thumbnailUrl, lastSubmittedPrompt, recordingMode]);

  const handleOpenChange = (open: boolean) => {
    if (!open && !isRotating) {
      onClose();
      setClipStep("summary"); // Reset the clip step to summary when the modal is closed
    }
  };

  if (isGuestMode) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <GuestModeContent clipData={clipData} onClose={onClose} />
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {clipStep === "summary" && (
        <ClipSummaryContent
          clipData={clipData}
          setClipStep={setClipStep}
          setClipData={setClipData}
        />
      )}
      {clipStep === "share" && <ClipShareContent clipData={clipData} />}
    </Dialog>
  );
}
