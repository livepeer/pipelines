import { Logo } from "@/components/sidebar";
import { useEffect, useState } from "react";

interface OverlayProps {
  statusMessage: string;
}

const loadingMessages = [
  "Spinning up dream machines...",
  "Unlocking creative dimensions...",
  "Manifesting digital visions...",
  "Gathering inspiration particles...",
  "Tuning the imagination engines...",
  "Shuffling reality puzzles...",
  "Calibrating your thought projector...",
  "Unwrapping visual possibilities...",
  "Firing up the wonder factory...",
  "Rendering realms of possibility...",
  "Stirring the pixel potion..."
];

export default function Overlay({ statusMessage }: OverlayProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => 
        prevIndex === loadingMessages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="absolute inset-0 rounded-2xl loading-gradient z-10"></div>
      <div className="absolute inset-0 rounded-2xl backdrop-blur-[125px] z-20"></div>
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl z-20">
        <Logo className="w-8 h-8 sm:w-10 sm:h-10 mb-6" />
        <div className="flex flex-col items-center gap-6 justify-center max-w-80 text-foreground sm:mb-6">
          <p className="shimmer-text shimmer-slow text-lg sm:text-xl font-semibold">
          {loadingMessages[currentMessageIndex]}
            
            {/* 
            Keeping statusMessage Logic if we want to return to contextual status messages. Right now, 
            we think that non-contextual messages create a better user experience. 
            statusMessage ? (
              statusMessage
            ) : (
              <span>
                Welcome to <span className="font-medium"> Daydream</span>
              </span>
            )}
          </p> */}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow ring-1 ring-black/5 z-30"></div>
    </>
  );
}
