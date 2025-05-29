"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@repo/design-system/lib/utils";
import { getIframeUrl, useMultiplayerStreamStore } from "./VideoSection";
import { LivepeerPlayer } from "./LivepeerPlayer";
import useMobileStore from "@/hooks/useMobileStore";

interface TransitioningVideoProps {
  useLivepeerPlayer?: boolean;
  onVideoClick?: () => void;
}

export function TransitioningVideo({
  useLivepeerPlayer = false,
  onVideoClick,
}: TransitioningVideoProps) {
  const { isMobile } = useMobileStore();
  const { currentStream } = useMultiplayerStreamStore();
  const [isLoading, setIsLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isInTransition, setIsInTransition] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroVideoRef = useRef<HTMLDivElement>(null);
  const mainVideoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroVideoRef.current || !mainVideoRef.current) return;

      const heroRect = heroVideoRef.current.getBoundingClientRect();
      const mainRect = mainVideoRef.current.getBoundingClientRect();

      // Calculate scroll progress based on when hero video starts going out of view
      // and when main video area comes into view
      const scrollStart = Math.max(
        0,
        -heroRect.bottom + window.innerHeight * 0.8,
      );
      const scrollEnd = Math.max(0, -mainRect.top + window.innerHeight * 0.2);
      const scrollDistance = scrollEnd - scrollStart;

      if (scrollDistance > 0) {
        const currentScroll = Math.max(0, window.scrollY - scrollStart);
        const progress = Math.min(1, currentScroll / scrollDistance);
        setScrollProgress(progress);
        setIsInTransition(progress > 0 && progress < 1);
      } else {
        setScrollProgress(0);
        setIsInTransition(false);
      }
    };

    handleScroll(); // Initial calculation
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!currentStream) return null;

  // Calculate video dimensions and position based on scroll progress
  const heroSize = { width: 190, height: 190 * (9 / 16) }; // aspect-video
  const getVideoStyle = () => {
    if (isMobile) {
      // On mobile, just show in the designated areas without transition
      return {};
    }

    if (!heroVideoRef.current || !mainVideoRef.current) {
      return {};
    }

    const heroRect = heroVideoRef.current.getBoundingClientRect();
    const mainRect = mainVideoRef.current.getBoundingClientRect();

    if (scrollProgress === 0) {
      // Small state - positioned in hero
      return {
        position: "fixed" as const,
        top: heroRect.top,
        left: heroRect.left,
        width: heroSize.width,
        height: heroSize.height,
        zIndex: 1000,
        borderRadius: "8px",
        overflow: "hidden",
      };
    } else if (scrollProgress === 1) {
      // Large state - positioned in main video area
      return {
        position: "fixed" as const,
        top: mainRect.top,
        left: mainRect.left,
        width: mainRect.width,
        height: mainRect.height,
        zIndex: 10,
        borderRadius: isMobile ? "0px" : "12px",
        overflow: "hidden",
      };
    } else {
      // Transitioning state - interpolate between positions
      const top = heroRect.top + (mainRect.top - heroRect.top) * scrollProgress;
      const left =
        heroRect.left + (mainRect.left - heroRect.left) * scrollProgress;
      const width =
        heroSize.width + (mainRect.width - heroSize.width) * scrollProgress;
      const height =
        heroSize.height + (mainRect.height - heroSize.height) * scrollProgress;
      const borderRadius = 8 + (isMobile ? -8 : 4) * scrollProgress;

      return {
        position: "fixed" as const,
        top,
        left,
        width,
        height,
        zIndex: 1000,
        borderRadius: `${borderRadius}px`,
        overflow: "hidden",
        transition: "none", // Disable CSS transitions during scroll-based animation
      };
    }
  };

  const videoStyle = getVideoStyle();

  return (
    <>
      {/* Hero video placeholder */}
      <div
        ref={heroVideoRef}
        className="w-[190px] aspect-video rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow relative"
        onClick={onVideoClick}
        style={{
          visibility: !isMobile && scrollProgress > 0 ? "hidden" : "visible",
        }}
      >
        {(isMobile || scrollProgress === 0) && (
          <div className="w-full h-full rounded-lg overflow-hidden">
            {useLivepeerPlayer ? (
              <LivepeerPlayer
                playbackId={currentStream?.transformedPlaybackId}
                autoPlay={true}
                muted={true}
                className="w-full h-full"
                env="monster"
                lowLatency="force"
              />
            ) : (
              <iframe
                src={getIframeUrl({
                  playbackId: currentStream?.transformedPlaybackId,
                  lowLatency: true,
                })}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                scrolling="no"
                onLoad={() => setIsLoading(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* Main video placeholder */}
      <div
        ref={mainVideoRef}
        className={cn(
          "w-full relative overflow-hidden bg-black/10 backdrop-blur-sm shadow-lg",
          isMobile
            ? "aspect-video rounded-none h-[calc(100%)]"
            : "md:rounded-xl md:aspect-video h-[calc(100%)]",
        )}
        style={{
          visibility: !isMobile && scrollProgress < 1 ? "hidden" : "visible",
        }}
      >
        {(isMobile || scrollProgress === 1) && (
          <div className="w-full h-full relative overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <div className="absolute inset-0 w-full h-full overflow-hidden">
              {useLivepeerPlayer ? (
                <LivepeerPlayer
                  playbackId={currentStream?.transformedPlaybackId}
                  autoPlay={true}
                  muted={false}
                  className={cn(
                    "w-[120%] h-[120%] absolute left-[-10%] top-[-10%]",
                    isMobile ? "w-[130%] h-[130%]" : "",
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
                    "absolute w-[120%] h-[120%] left-[-10%] top-[-10%] md:w-[120%] md:h-[120%] md:left-[-10%] md:top-[-10%]",
                    isMobile ? "w-[130%] h-[130%] left-[-15%] top-[-15%]" : "",
                  )}
                  style={{ overflow: "hidden" }}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  onLoad={() => setIsLoading(false)}
                  scrolling="no"
                />
              )}
            </div>

            {!isMobile && (
              <div className="absolute bottom-4 left-4 w-[25%] aspect-video z-30 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg hidden md:block">
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
        )}
      </div>

      {/* Transitioning video element */}
      {!isMobile && isInTransition && (
        <div style={videoStyle} className="pointer-events-none">
          {useLivepeerPlayer ? (
            <LivepeerPlayer
              playbackId={currentStream?.transformedPlaybackId}
              autoPlay={true}
              muted={scrollProgress < 0.5}
              className="w-full h-full"
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
              className="w-full h-full"
              style={{ overflow: "hidden" }}
              allow="autoplay; fullscreen"
              allowFullScreen
              scrolling="no"
            />
          )}
        </div>
      )}
    </>
  );
}
