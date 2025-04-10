import { useCallback, useEffect, useRef, useState } from "react";

type ViewportDistanceState = "visible" | "near" | "far";

interface UseVideoLifecycleOptions {
  nearThreshold?: number;
  aspectRatio?: number;
}

export default function useVideoLifecycle(
  options: UseVideoLifecycleOptions = {},
) {
  const { nearThreshold = 1000, aspectRatio = 16 / 9 } = options;

  const [viewportState, setViewportState] =
    useState<ViewportDistanceState>("far");
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useRef({ width: 0, height: 0 });

  const updateViewportState = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    dimensions.current = {
      width: rect.width,
      height: rect.height,
    };

    if (rect.bottom >= 0 && rect.top <= windowHeight) {
      setViewportState("visible");
    } else if (
      (rect.top > 0 && rect.top <= windowHeight + nearThreshold) ||
      (rect.bottom < 0 && rect.bottom >= -nearThreshold)
    ) {
      setViewportState("near");
    } else {
      setViewportState("far");
    }
  }, [nearThreshold]);

  useEffect(() => {
    updateViewportState();

    const handleScroll = () => {
      window.requestAnimationFrame(updateViewportState);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateViewportState);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateViewportState);
    };
  }, [updateViewportState]);

  // Should we show the video?
  const shouldRenderVideo =
    viewportState === "visible" || viewportState === "near";

  const containerStyle = !shouldRenderVideo
    ? {
        width:
          dimensions.current.width > 0
            ? `${dimensions.current.width}px`
            : "100%",
        height:
          dimensions.current.height > 0 ? `${dimensions.current.height}px` : 0,
        aspectRatio:
          dimensions.current.width === 0 ? `${aspectRatio}` : undefined,
      }
    : {};

  return {
    containerRef,
    shouldRenderVideo,
    containerStyle,
    viewportState,
  };
}
