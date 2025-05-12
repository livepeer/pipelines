"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

export function VideoSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [originalLoading, setOriginalLoading] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasAutoTransitioned, setHasAutoTransitioned] = useState(false);
  const animationRef = useRef<number | null>(null);

  const TRANSITION_DURATION = 0.3; // seconds - reduced for faster wipe
  const DELAY_BEFORE_TRANSITION = 2; // seconds

  // Swap the playback IDs to reverse the order
  const ORIGINAL_PLAYBACK_ID = "95705ossoplg7uvq";
  const INITIAL_PLAYBACK_ID = "85c28sa2o8wppm58";
  const originalIframeUrl = `https://monster.lvpr.tv/?v=${ORIGINAL_PLAYBACK_ID}&lowLatency=force&backoffMax=1000&ingestPlayback=true`;
  const initialIframeUrl = `https://lvpr.tv/?v=${INITIAL_PLAYBACK_ID}&lowLatency=false&muted=true`;

  // Function to trigger transition in either direction
  const triggerTransition = useCallback(
    (toOriginal: boolean) => {
      if (isTransitioning) return;

      // Cancel any existing animation
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      setIsTransitioning(true);
      const startValue = toOriginal ? 0 : 1.2;
      const endValue = toOriginal ? 1.2 : 0;

      setShowOriginal(true);
      setTransitionProgress(startValue);

      // Animate the transition
      const startTime = Date.now();
      const endTime = startTime + TRANSITION_DURATION * 1000;

      const animateTransition = () => {
        const now = Date.now();
        if (now < endTime) {
          // Calculate progress
          const elapsed = (now - startTime) / (TRANSITION_DURATION * 1000);
          const progress = toOriginal ? elapsed : 1 - elapsed;

          // Scale from 0 to 1.2 for complete coverage
          const scaledProgress = progress * 1.2;
          setTransitionProgress(scaledProgress);
          animationRef.current = requestAnimationFrame(animateTransition);
        } else {
          // End transition
          setTransitionProgress(endValue);
          setIsTransitioning(false);
          animationRef.current = null;

          // If we animated back to 0, hide the original completely
          if (endValue === 0) {
            setShowOriginal(false);
          }
        }
      };

      animationRef.current = requestAnimationFrame(animateTransition);
    },
    [isTransitioning],
  );

  // Initial automatic transition - only happens once
  useEffect(() => {
    if (!isLoading && !originalLoading && !hasAutoTransitioned) {
      // Start the transition after delay
      const delayTimer = setTimeout(() => {
        triggerTransition(true);
        setHasAutoTransitioned(true);
      }, DELAY_BEFORE_TRANSITION * 1000);

      return () => clearTimeout(delayTimer);
    }
  }, [isLoading, originalLoading, triggerTransition, hasAutoTransitioned]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Calculate the clip path based on transition progress
  const getClipPath = () => {
    if (!showOriginal) return "polygon(0% 0%, 0% 0%, 0% 0%)";
    if (transitionProgress >= 1.2)
      return "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";

    // Create a diagonal from top-left to bottom-right
    const pos = transitionProgress * 150; // Larger value to ensure complete coverage
    return `polygon(0% 0%, ${pos}% 0%, 0% ${pos}%)`;
  };

  // Determine which video is currently more visible
  const isOriginalVisible = showOriginal && transitionProgress >= 0.6;
  const bothButtonsReady =
    !isLoading && !originalLoading && hasAutoTransitioned;

  return (
    <div className="w-full md:w-[70%] relative md:rounded-lg overflow-hidden bg-black/10 backdrop-blur-sm shadow-lg md:aspect-video h-full md:h-full md:relative">
      <div className="absolute top-3 left-3 z-20 hidden md:block">
        <h1
          className="text-4xl md:text-[36px] font-bold tracking-widest italic mix-blend-difference"
          style={{ color: "rgba(255, 255, 255, 0.65)" }}
        >
          DAYDREAM
        </h1>
      </div>

      <div className="w-full h-full relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Initial video (transformed video) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <iframe
            src={initialIframeUrl}
            className="absolute w-[120%] h-[120%] left-[-10%] top-[-10%] md:w-[120%] md:h-[120%] md:left-[-10%] md:top-[-10%]"
            style={{ overflow: "hidden" }}
            allow="autoplay; fullscreen"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
            scrolling="no"
          />
        </div>

        {/* Original video with diagonal wipe effect */}
        <div
          className="absolute inset-0 w-full h-full overflow-hidden z-15"
          style={{
            clipPath: getClipPath(),
            WebkitClipPath: getClipPath(), // For Safari support
          }}
        >
          {originalLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <iframe
            src={originalIframeUrl}
            className="absolute w-[120%] h-[120%] left-[-10%] top-[-10%] md:w-[120%] md:h-[120%] md:left-[-10%] md:top-[-10%]"
            style={{ overflow: "hidden" }}
            allow="autoplay"
            onLoad={() => setOriginalLoading(false)}
            scrolling="no"
          />
        </div>

        {/* Transparent overlay to prevent interaction with video controls - but not with our buttons */}
        <div className="absolute inset-0 z-20 pointer-events-auto bg-transparent"></div>

        {/* Control buttons - outside the overlay structure for better z-index control */}
        {bothButtonsReady && (
          <>
            {/* "See original" button - only visible when transformed is showing */}
            {!isOriginalVisible && (
              <button
                className="absolute bottom-6 right-6 z-50 bg-black/60 text-white px-4 py-2 rounded-full font-medium hover:bg-black/80 transition-colors"
                onClick={() => triggerTransition(true)}
                disabled={isTransitioning}
              >
                See transformed
              </button>
            )}

            {/* "See transformed" button - only visible when original is showing */}
            {isOriginalVisible && (
              <button
                className="absolute bottom-6 right-6 z-50 bg-black/60 text-white px-4 py-2 rounded-full font-medium hover:bg-black/80 transition-colors"
                onClick={() => triggerTransition(false)}
                disabled={isTransitioning}
              >
                See original
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
