import { Button } from "@repo/design-system/components/ui/button";
import { useVideoClip } from "../hooks/useVideoClip";
import { ClipModal } from "./ClipModal";

interface MobileClipButtonProps {
  disabled?: boolean;
  trackAnalytics?: (event: string, props?: Record<string, any>) => void;
  isAuthenticated?: boolean;
}

export const MobileClipButton = ({
  disabled = false,
  trackAnalytics,
  isAuthenticated = false
}: MobileClipButtonProps) => {
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

  const circleDegrees = (progress / 100) * 360;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="p-0 m-0 bg-transparent border-none hover:bg-transparent focus:outline-none relative"
        onClick={handleClick}
        disabled={disabled || isRecording}
      >
        {!isRecording && (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
        )}
        
        {isRecording && (
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24"
          >
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
            
            <rect
              x="8"
              y="8"
              width="8"
              height="8"
              fill="#ff3333"
            />
          </svg>
        )}
      </Button>

      <ClipModal
        isOpen={showClipModal}
        onClose={closeClipModal}
        clipUrl={clipUrl}
        clipFilename={clipFilename}
      />
    </>
  );
}; 