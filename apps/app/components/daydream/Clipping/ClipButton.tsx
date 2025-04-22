import { Button } from "@repo/design-system/components/ui/button";
import { useVideoClip } from "../../../hooks/useVideoClip";
import { cn } from "@repo/design-system/lib/utils";
import { ClipModal } from "./ClipModal";
import { ClipOptionsModal, ClipRecordingMode } from "./ClipOptionsModal";
import { Scissors, Square } from "lucide-react";

interface ClipButtonProps {
  disabled?: boolean;
  className?: string;
  trackAnalytics?: (event: string, props?: Record<string, any>) => void;
  isAuthenticated?: boolean;
  isMobile?: boolean;
}

const RecordingProgressIcon = ({ progress }: { progress: number }) => {
  const circleDegrees = (progress / 100) * 360;
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="#ff3333"
        strokeWidth="3"
        strokeDasharray={`${(circleDegrees / 360) * 2 * Math.PI * 10}, ${2 * Math.PI * 10}`}
        transform="rotate(-90, 12, 12)"
      />
      <rect x="8" y="8" width="8" height="8" fill="#ff3333" />
    </svg>
  );
};

export const ClipButton = ({
  disabled = false,
  className = "",
  trackAnalytics,
  isAuthenticated = false,
  isMobile = false,
}: ClipButtonProps) => {
  const {
    recordClip,
    stopRecording,
    showRecordingOptions,
    isRecording,
    progress,
    clipUrl,
    clipFilename,
    showClipModal,
    closeClipModal,
    showOptionsModal,
    closeOptionsModal,
  } = useVideoClip();

  const handleClick = () => {
    if (isRecording) {
      if (trackAnalytics) {
        trackAnalytics("daydream_clip_stopped", {
          is_authenticated: isAuthenticated,
          progress: progress,
        });
      }
      stopRecording();
      return;
    }

    if (trackAnalytics) {
      trackAnalytics("daydream_clip_button_clicked", {
        is_authenticated: isAuthenticated,
      });
    }
    showRecordingOptions();
  };

  const handleCreateClip = (mode: ClipRecordingMode) => {
    recordClip(mode);
  };

  return (
    <>
      {!isMobile && (
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 gap-2 relative overflow-hidden", className)}
          onClick={handleClick}
          disabled={disabled}
        >
          {/* Progress bar */}
          {isRecording && (
            <>
              <div className="absolute inset-0 bg-gray-200/20 rounded-md" />

              <div
                className="absolute inset-0 bg-[#ff3333] z-0 rounded-md"
                style={{
                  width: `${progress}%`,
                  boxShadow: "0 0 8px rgba(255, 51, 51, 0.7)",
                }}
              />
            </>
          )}

          <div className="z-20 relative flex items-center gap-2">
            {isRecording ? <Square size={16} /> : <Scissors size={16} />}
            <span>{isRecording ? "Stop Recording" : "Create Clip"}</span>
          </div>
        </Button>
      )}

      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="p-0 m-0 bg-transparent border-none hover:bg-transparent focus:outline-none relative"
          onClick={handleClick}
          disabled={disabled}
        >
          {!isRecording && <Scissors size={16} />}
          {isRecording && <Square size={16} />}
        </Button>
      )}

      <ClipModal
        isOpen={showClipModal}
        onClose={closeClipModal}
        clipUrl={clipUrl}
        clipFilename={clipFilename}
      />

      <ClipOptionsModal
        isOpen={showOptionsModal}
        onClose={closeOptionsModal}
        onCreateClip={handleCreateClip}
      />
    </>
  );
};
