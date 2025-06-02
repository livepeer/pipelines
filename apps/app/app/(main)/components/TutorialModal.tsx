"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@repo/design-system/components/ui/dialog";
import { Play, VolumeX, Volume2, X } from "lucide-react";
import { cn } from "@repo/design-system/lib/utils";
import track from "@/lib/track";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            track("tutorial_video_shown", { location: "homepage_modal" });
          })
          .catch(error => {
            console.error("Error playing video:", error);
            setIsPlaying(false);
            track("tutorial_video_autoplay_error", { error: error.message });
          });
      }
    }
  }, [isOpen]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        track("tutorial_video_paused", {
          currentTime: videoRef.current.currentTime,
          duration: videoRef.current.duration,
          location: "homepage_modal",
        });
      } else {
        videoRef.current.play().catch(error => {
          console.error("Error playing video:", error);
          track("tutorial_video_play_error", { error: error.message });
        });
        track("tutorial_video_resumed", {
          currentTime: videoRef.current.currentTime,
          duration: videoRef.current.duration,
          location: "homepage_modal",
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
        location: "homepage_modal",
      });
    }
  };

  const handleVideoEnd = () => {
    track("tutorial_video_completed", { location: "homepage_modal" });
    setIsPlaying(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[80vw] max-h-[90vh] p-0 rounded-xl overflow-hidden border-0 bg-black z-[2000]"
        onInteractOutside={e => e.preventDefault()}
      >
        <div className="relative w-full h-full flex justify-center items-center">
          <video
            ref={videoRef}
            src="https://storage.googleapis.com/livepeer-ai-video-dev/tutorial.mp4"
            className="w-full h-full max-h-[80vh] object-contain bg-black"
            playsInline
            muted={isMuted}
            onEnded={handleVideoEnd}
            onClick={togglePlayPause}
          />

          {!isPlaying && (
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={togglePlayPause}
            >
              <div className="p-4 rounded-full bg-black/20 backdrop-blur-sm hover:scale-110 transition-transform">
                <Play className="h-16 w-16 text-white fill-white" />
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-4">
            <button
              onClick={toggleMute}
              className="p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="text-white h-6 w-6" />
              ) : (
                <Volume2 className="text-white h-6 w-6" />
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="text-white h-6 w-6" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
