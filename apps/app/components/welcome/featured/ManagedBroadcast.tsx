"use client";

import { useEffect, useRef, useState } from "react";
import { BroadcastWithControls } from "@/components/playground/broadcast";
import { Loader2 } from "lucide-react";
import { cn } from "@repo/design-system/lib/utils";
import { useIsMobile } from "@repo/design-system/hooks/use-mobile";

interface ManagedBroadcastProps {
  streamUrl: string | null;
  isFullscreen: boolean;
  outputPlayerRef: React.RefObject<HTMLDivElement>;
  loading?: boolean;
}

export function ManagedBroadcast({
  streamUrl,
  isFullscreen,
  outputPlayerRef,
  loading = false,
}: ManagedBroadcastProps) {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [playerPosition, setPlayerPosition] = useState({ bottom: 0, right: 0 });

  useEffect(() => {
    if (!isMobile && outputPlayerRef.current) {
      const updatePlayerPosition = () => {
        if (!outputPlayerRef.current) return;
        const rect = outputPlayerRef.current.getBoundingClientRect();
        const newBottom = rect.bottom;
        const newRight = rect.right;

        setPlayerPosition(prev => {
          if (prev.bottom === newBottom && prev.right === newRight) {
            return prev;
          }
          return { bottom: newBottom, right: newRight };
        });
      };

      updatePlayerPosition();

      window.addEventListener("resize", updatePlayerPosition);
      window.addEventListener("scroll", updatePlayerPosition);

      const resizeObserver = new ResizeObserver(() => {
        updatePlayerPosition();
      });

      resizeObserver.observe(outputPlayerRef.current);

      return () => {
        window.removeEventListener("resize", updatePlayerPosition);
        window.removeEventListener("scroll", updatePlayerPosition);
        resizeObserver.disconnect();
      };
    }
  }, [isMobile, outputPlayerRef]);

  useEffect(() => {
    setIsCollapsed(isMobile);
  }, [isMobile]);

  if (!streamUrl) return null;

  return (
    <div
      className={cn(
        "transition-all duration-100",
        isMobile ? "mx-4 w-auto -mt-2 mb-4" : "absolute z-50",
      )}
      style={
        !isMobile
          ? {
              position: "fixed",
              bottom: isFullscreen
                ? "80px"
                : `${window.innerHeight - playerPosition.bottom + 40}px`,
              right: isFullscreen
                ? "16px"
                : `${window.innerWidth - playerPosition.right + 20}px`,
              width: isCollapsed ? "48px" : "250px",
              height: isCollapsed ? "48px" : "auto",
              aspectRatio: isCollapsed ? "1" : "16/9",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              transform: "translate(0, 0)",
            }
          : {}
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
                  isCollapsed ? "h-8" : "h-64",
                )
              : cn(
                  "rounded-xl overflow-hidden",
                  isCollapsed ? "w-12 h-12" : "w-full aspect-video",
                ),
          )}
        >
          <BroadcastWithControls
            ingestUrl={streamUrl}
            isCollapsed={isCollapsed}
            onCollapse={setIsCollapsed}
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
