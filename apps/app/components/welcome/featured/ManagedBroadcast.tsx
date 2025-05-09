"use client";

import {
  BroadcastWithControls,
  useBroadcastUIStore,
} from "@/components/playground/broadcast";
import { useDreamshaperStore } from "@/hooks/useDreamshaper";
import useFullscreenStore from "@/hooks/useFullscreenStore";
import useMobileStore from "@/hooks/useMobileStore";
import { cn } from "@repo/design-system/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { usePlayerPositionStore } from "./usePlayerPosition";
import { useOverlayStore } from "@/hooks/useOverlayStore";

// Simple hook to track window resize events
function useIsResizing(): boolean {
  const [isResizing, setIsResizing] = useState(false);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsResizing(true);

      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }

      resizeTimerRef.current = setTimeout(() => {
        setIsResizing(false);
      }, 200);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
    };
  }, []);

  return isResizing;
}

export function ManagedBroadcast() {
  const { isMobile } = useMobileStore();
  const { loading, streamUrl } = useDreamshaperStore();
  const { isFullscreen } = useFullscreenStore();
  const { isOverlayOpen } = useOverlayStore();
  const isResizing = useIsResizing();

  const { collapsed, setCollapsed } = useBroadcastUIStore();
  const { position } = usePlayerPositionStore();

  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  if (!streamUrl) return null;

  const overlayOffset = !isMobile && isOverlayOpen && !isResizing ? 250 : 0;

  return (
    <div
      className={cn(
        "transition-all duration-100",
        isMobile ? "mx-4 w-auto -mt-2 mb-4" : "absolute z-50",
      )}
      style={
        isMobile
          ? {}
          : {
              position: "fixed",
              bottom: isFullscreen
                ? "80px"
                : `${window.innerHeight - position.bottom + 40}px`,
              right: isFullscreen
                ? "16px"
                : `calc(${window.innerWidth - position.right + 20 + overlayOffset}px)`,
              width: collapsed ? "48px" : "250px",
              height: collapsed ? "48px" : "auto",
              aspectRatio: collapsed ? "1" : "16/9",
              transform: "translate(0, 0)",
            }
      }
    >
      {loading && isMobile ? (
        <div className="w-8 h-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div
          className={cn(
            "transition-all duration-300",
            isMobile
              ? cn(
                  "flex-shrink-0 [&>div]:!pb-0 [&>div]:h-full",
                  collapsed ? "h-8" : "h-64",
                )
              : cn(
                  "rounded-xl overflow-hidden",
                  collapsed ? "w-12 h-12" : "w-full aspect-video",
                ),
          )}
        >
          <BroadcastWithControls
            className={cn(
              "rounded-xl overflow-hidden",
              isMobile ? "w-full h-full" : "",
            )}
          />
        </div>
      )}
    </div>
  );
}
