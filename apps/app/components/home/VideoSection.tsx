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

  const TRANSITION_DURATION = 0.6;
  const DELAY_BEFORE_TRANSITION = 2;

  const ORIGINAL_PLAYBACK_ID = "95705ossoplg7uvq";
  const INITIAL_PLAYBACK_ID = "85c28sa2o8wppm58";
  const originalIframeUrl = `https://monster.lvpr.tv/?v=${ORIGINAL_PLAYBACK_ID}&lowLatency=force&backoffMax=1000&ingestPlayback=true`;
  const initialIframeUrl = `https://lvpr.tv/?v=${INITIAL_PLAYBACK_ID}&lowLatency=false&muted=true`;

  const triggerTransition = useCallback(
    (toOriginal: boolean) => {
      if (isTransitioning) return;

      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      setIsTransitioning(true);
      const startValue = toOriginal ? 0 : 1;
      const endValue = toOriginal ? 1 : 0;

      setShowOriginal(true);
      setTransitionProgress(startValue);

      const startTime = Date.now();
      const endTime = startTime + TRANSITION_DURATION * 1000;

      const animateTransition = () => {
        const now = Date.now();
        if (now < endTime) {
          const elapsed = (now - startTime) / (TRANSITION_DURATION * 1000);
          const progress = toOriginal ? elapsed : 1 - elapsed;

          setTransitionProgress(progress);
          animationRef.current = requestAnimationFrame(animateTransition);
        } else {
          setTransitionProgress(endValue);
          setIsTransitioning(false);
          animationRef.current = null;

          if (endValue === 0) {
            setTimeout(() => {
              setShowOriginal(false);
            }, 100);
          }
        }
      };

      animationRef.current = requestAnimationFrame(animateTransition);
    },
    [isTransitioning],
  );

  useEffect(() => {
    if (!isLoading && !originalLoading && !hasAutoTransitioned) {
      const delayTimer = setTimeout(() => {
        triggerTransition(true);
        setHasAutoTransitioned(true);
      }, DELAY_BEFORE_TRANSITION * 1000);

      return () => clearTimeout(delayTimer);
    }
  }, [isLoading, originalLoading, triggerTransition, hasAutoTransitioned]);

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const isOriginalVisible = showOriginal && transitionProgress >= 0.5;
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

        <div
          className="absolute inset-0 w-full h-full overflow-hidden z-15"
          style={{
            opacity: showOriginal ? transitionProgress : 0,
            visibility: showOriginal ? "visible" : "hidden",
            transition: isTransitioning
              ? "none"
              : `opacity ${TRANSITION_DURATION}s ease-in-out`,
            pointerEvents: showOriginal ? "auto" : "none",
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

        <div className="absolute inset-0 z-20 pointer-events-auto bg-transparent"></div>

        {bothButtonsReady && (
          <>
            {!isOriginalVisible && (
              <button
                className="absolute bottom-6 right-6 z-50 bg-black/60 text-white px-4 py-2 rounded-full font-medium hover:bg-black/80 transition-colors"
                onClick={() => triggerTransition(true)}
                disabled={isTransitioning}
              >
                See transformed
              </button>
            )}

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
