import React, { useState } from "react";
import { Dialog } from "@repo/design-system/components/ui/dialog";
import { usePhoneRotation } from "@/hooks/usePhoneRotation";
import { ClipSummaryContent } from "./ClipSummaryContent";
import ClipShareContent from "./ClipShareContent";
import { ClipData } from "./types";

interface ClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  clipUrl: string | null;
  clipFilename: string | null;
}

type ClipStep = "summary" | "share";

export function ClipModal({
  isOpen,
  onClose,
  clipUrl,
  clipFilename,
}: ClipModalProps) {
  const isRotating = usePhoneRotation();
  const [clipStep, setClipStep] = useState<ClipStep>("summary");
  const [clipData, setClipData] = useState<ClipData>({
    clipUrl: clipUrl || null,
    clipFilename: clipFilename || null,
    serverClipUrl: null,
  });

  const handleOpenChange = (open: boolean) => {
    if (!open && !isRotating) {
      onClose();
    }
  };

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
