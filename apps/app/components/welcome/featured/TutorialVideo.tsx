"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@repo/design-system/lib/utils";
import track from "@/lib/track";

interface TutorialVideoProps {
  onComplete?: () => void;
}

// LivepeerLogo component with white fill
const LivepeerLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      className={cn("translate-x-2", className)}
      width="50"
      height="50"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.305908 14.4529L0.305908 17.5L3.2968 17.5L3.2968 14.4529L0.305908 14.4529ZM0.305908 7.39808L0.305908 10.4451L3.2968 10.4451L3.2968 7.39808L0.305908 7.39808ZM13.2147 7.39808L13.2147 10.4451L16.2056 10.4451L16.2056 7.39808L13.2147 7.39808ZM0.305908 3.54706L0.305907 0.499996L3.2968 0.499996L3.2968 3.54706L0.305908 3.54706ZM6.76031 6.91402L6.76031 3.86696L9.75121 3.86696L9.75121 6.91402L6.76031 6.91402ZM6.76031 10.9258L6.76031 13.9728L9.75121 13.9728L9.75121 10.9258L6.76031 10.9258Z"
        fill="white"
      />
    </svg>
  );
};

const VolumeOnIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14.5 9.5C14.5 9.5 15 10.5 15 12C15 13.5 14.5 14.5 14.5 14.5"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17.5 6.5C17.5 6.5 19 8.5 19 12C19 15.5 17.5 17.5 17.5 17.5"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 5L6 9H3V15H6L11 19V5Z"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const VolumeOffIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11 5L6 9H3V15H6L11 19V5Z"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 9L16 15"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 9L22 15"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlayIcon = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="12"
      cy="12"
      r="11"
      stroke="white"
      strokeWidth="1.5"
      fill="rgba(0, 0, 0, 0.5)"
    />
    <path
      d="M16 12L10 16.5V7.5L16 12Z"
      fill="white"
      stroke="white"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const TutorialVideo = ({ onComplete }: TutorialVideoProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [introOpacity, setIntroOpacity] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    track("tutorial_video_shown", {});

    requestAnimationFrame(() => {
      setIntroOpacity(1);
    });

    const timer = setTimeout(() => {
      setShowIntro(false);
      setIsPlaying(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showIntro && videoRef.current && isPlaying) {
      const playPromise = videoRef.current.play();

      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing video:", error);
          track("tutorial_video_autoplay_error", { error: error.message });

          setIsPlaying(false);
        });
      }
    }
  }, [showIntro, isPlaying]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && !showIntro) {
      try {
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(error => {
              setIsPlaying(false);
            });
        }
      } catch (e) {
        console.error("Error during initial play attempt:", e);
        setIsPlaying(false);
      }
    }
  }, [videoRef.current, showIntro]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.removeEventListener("ended", handleVideoEnd);

      videoElement.addEventListener("ended", handleVideoEnd);

      videoElement.addEventListener("timeupdate", () => {
        if (videoElement.currentTime >= videoElement.duration - 0.5) {
          handleVideoEnd();
        }
      });
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener("ended", handleVideoEnd);
        videoElement.removeEventListener("timeupdate", () => {});
      }
    };
  }, [videoRef.current]);

  useEffect(() => {
    if (isFadingOut) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) {
          onComplete();
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isFadingOut, onComplete]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        track("tutorial_video_paused", {
          currentTime: videoRef.current.currentTime,
          duration: videoRef.current.duration,
        });
      } else {
        videoRef.current.play().catch(error => {
          console.error("Error playing video:", error);
          track("tutorial_video_play_error", { error: error.message });
        });
        track("tutorial_video_resumed", {
          currentTime: videoRef.current.currentTime,
          duration: videoRef.current.duration,
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
      track("tutorial_video_mute_toggle", {
        muted: !isMuted,
        currentTime: videoRef.current.currentTime,
      });
    }
  };

  const handleVideoEnd = () => {
    setIsFadingOut(true);
    track("tutorial_video_completed", {});
  };

  const handleSkip = () => {
    setIsFadingOut(true);
    track("tutorial_video_skipped", {
      currentTime: videoRef.current?.currentTime,
      duration: videoRef.current?.duration,
    });
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-[100] bg-black flex items-center justify-center",
        isFadingOut && "opacity-0",
      )}
      style={{
        transition: "opacity 1s ease-in-out",
      }}
    >
      {showIntro ? (
        <div
          className="flex flex-col items-center justify-center text-white text-center px-6 w-full h-full"
          style={{
            opacity: introOpacity,
            transition: "opacity 0.6s ease-in-out",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          }}
        >
          <div className="bg-black/50 p-6 rounded-xl backdrop-blur-sm flex flex-col items-center">
            <div className="p-2 rounded-full flex items-center justify-center mb-4">
              <LivepeerLogo />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              See daydream in action
            </h1>
            <p className="text-lg md:text-xl text-white/80">
              Before we start, a quick product tour!
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src="https://storage.googleapis.com/livepeer-ai-video-dev/tutorial.mp4"
              className="w-full h-full object-contain"
              playsInline
              muted={isMuted}
              autoPlay
              onClick={togglePlayPause}
            />

            {!isPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                onClick={togglePlayPause}
              >
                <div className="p-4 rounded-full bg-black/20 backdrop-blur-sm hover:scale-110 transition-transform">
                  <PlayIcon />
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-4">
              <button
                onClick={toggleMute}
                className="p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
              </button>
            </div>
            <button
              onClick={handleSkip}
              className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-md text-sm font-medium transition-colors"
            >
              Skip
            </button>
          </div>
        </>
      )}
    </div>
  );
};
