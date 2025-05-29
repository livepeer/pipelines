"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@repo/design-system/lib/utils";
import { getIframeUrl, useMultiplayerStreamStore } from "./VideoSection";
import { LivepeerPlayer } from "./LivepeerPlayer";
import useMobileStore from "@/hooks/useMobileStore";

interface TransitioningVideoProps {
  useLivepeerPlayer?: boolean;
  onVideoClick?: () => void;
  heroPositionRef: React.RefObject<HTMLDivElement>;
  mainPositionRef: React.RefObject<HTMLDivElement>;
}

export function TransitioningVideo({
  useLivepeerPlayer = false,
  onVideoClick,
  heroPositionRef,
  mainPositionRef,
}: TransitioningVideoProps) {
  const { isMobile } = useMobileStore();
  const { currentStream } = useMultiplayerStreamStore();
  const [isLoading, setIsLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [videoStyle, setVideoStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const handleScroll = () => {
      if (!heroPositionRef.current || !mainPositionRef.current || isMobile) {
        setScrollProgress(0);
        return;
      }

      const heroRect = heroPositionRef.current.getBoundingClientRect();
      const mainRect = mainPositionRef.current.getBoundingClientRect();

      // Calculate transition based on scroll position
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;

      // Start transition when hero video is about to leave viewport
      const heroBottom = heroRect.bottom + scrollY;
      const transitionStart = heroBottom - viewportHeight * 0.8;
      const transitionEnd = mainRect.top + scrollY - viewportHeight * 0.2;
      const transitionDistance = transitionEnd - transitionStart;

      if (transitionDistance > 0) {
        const currentProgress =
          Math.max(0, scrollY - transitionStart) / transitionDistance;
        const progress = Math.min(1, Math.max(0, currentProgress));
        setScrollProgress(progress);

        // Calculate interpolated position and size
        const heroSize = { width: 190, height: 190 * (9 / 16) };
        const mainSize = { width: mainRect.width, height: mainRect.height };

        const currentWidth =
          heroSize.width + (mainSize.width - heroSize.width) * progress;
        const currentHeight =
          heroSize.height + (mainSize.height - heroSize.height) * progress;

        const currentTop =
          heroRect.top + (mainRect.top - heroRect.top) * progress;
        const currentLeft =
          heroRect.left + (mainRect.left - heroRect.left) * progress;

        const currentBorderRadius = 8 + 4 * progress; // 8px to 12px

        setVideoStyle({
          position: "fixed",
          top: currentTop,
          left: currentLeft,
          width: currentWidth,
          height: currentHeight,
          borderRadius: `${currentBorderRadius}px`,
          overflow: "hidden",
          zIndex: progress < 1 ? 1000 : 10,
          transition: "none",
          pointerEvents: onVideoClick ? "auto" : "none",
        });
      } else {
        // Default to hero position
        setScrollProgress(0);
        setVideoStyle({
          position: "fixed",
          top: heroRect.top,
          left: heroRect.left,
          width: 190,
          height: 190 * (9 / 16),
          borderRadius: "8px",
          overflow: "hidden",
          zIndex: 1000,
          pointerEvents: onVideoClick ? "auto" : "none",
        });
      }
    };

    if (!isMobile) {
      handleScroll(); // Initial calculation
      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", handleScroll, { passive: true });
    }

    return () => {
      if (!isMobile) {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
      }
    };
  }, [heroPositionRef, mainPositionRef, isMobile, onVideoClick]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!currentStream) return null;

  // On mobile, render static videos in their respective containers
  if (isMobile) {
    return null; // Let the original components handle mobile
  }

  return (
    <div style={videoStyle} onClick={onVideoClick}>
      {isLoading && scrollProgress >= 0.8 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {useLivepeerPlayer ? (
        <LivepeerPlayer
          playbackId={currentStream?.transformedPlaybackId}
          autoPlay={true}
          muted={scrollProgress < 0.5}
          className={cn(
            scrollProgress < 0.8
              ? "w-full h-full"
              : "w-[120%] h-[120%] absolute left-[-10%] top-[-10%]",
          )}
          objectFit="cover"
          env="monster"
          lowLatency="force"
        />
      ) : (
        <iframe
          src={getIframeUrl({
            playbackId: currentStream?.transformedPlaybackId,
            lowLatency: true,
          })}
          className={cn(
            scrollProgress < 0.8
              ? "w-full h-full"
              : "absolute w-[120%] h-[120%] left-[-10%] top-[-10%]",
          )}
          style={{ overflow: "hidden" }}
          allow="autoplay; fullscreen"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          scrolling="no"
        />
      )}

      {/* Picture-in-picture for original stream when fully transitioned */}
      {!isMobile && scrollProgress >= 0.8 && (
        <div className="absolute bottom-4 left-4 w-[25%] aspect-video z-30 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
          {useLivepeerPlayer ? (
            <LivepeerPlayer
              playbackId={currentStream?.originalPlaybackId}
              autoPlay={true}
              muted={true}
              className="w-full h-full"
              env="studio"
              lowLatency="force"
            />
          ) : (
            <iframe
              src={getIframeUrl({
                playbackId: currentStream?.originalPlaybackId,
                lowLatency: false,
              })}
              className="w-full h-full"
              style={{ overflow: "hidden" }}
              allow="autoplay; fullscreen"
              allowFullScreen
              scrolling="no"
            />
          )}
        </div>
      )}
    </div>
  );
}
