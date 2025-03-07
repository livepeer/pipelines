import { Button } from "@repo/design-system/components/ui/button"; 
import { ClipIcon } from "@livepeer/react/assets"; 
import { useVideoClip } from "../hooks/useVideoClip";
import { cn } from "@repo/design-system/lib/utils";
import { ClipModal } from "./ClipModal";

interface ClipButtonProps {
  disabled?: boolean;
  className?: string;
  trackAnalytics?: (event: string, props?: Record<string, any>) => void;
  isAuthenticated?: boolean;
}

export const ClipButton = ({ 
  disabled = false, 
  className = "",
  trackAnalytics,
  isAuthenticated = false
}: ClipButtonProps) => {
  const { 
    recordClip, 
    isRecording, 
    progress,
    clipUrl,
    clipFilename,
    showClipModal,
    closeClipModal
  } = useVideoClip();

  const handleClick = () => {
    if (trackAnalytics) {
      trackAnalytics("daydream_clip_button_clicked", {
        is_authenticated: isAuthenticated,
      });
    }
    recordClip();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 gap-2 relative overflow-hidden",
          className
        )}
        onClick={handleClick}
        disabled={disabled || isRecording}
      >
        {/* Progress bar */}
        {isRecording && (
          <>
            <div className="absolute inset-0 bg-gray-200/20 rounded-md" />
            
            <div 
              className="absolute inset-0 bg-[#ff3333] z-10 rounded-md"
              style={{ 
                width: `${progress}%`,
                boxShadow: '0 0 8px rgba(255, 51, 51, 0.7)' 
              }}
            />
          </>
        )}
        
        <ClipIcon className="h-4 w-4 z-10 relative" />
        <span className="z-10 relative">
          {isRecording ? "Recording..." : "Clip (15s)"}
        </span>
      </Button>

      {/* Clip Preview Modal */}
      <ClipModal
        isOpen={showClipModal}
        onClose={closeClipModal}
        clipUrl={clipUrl}
        clipFilename={clipFilename}
      />
    </>
  );
}; 