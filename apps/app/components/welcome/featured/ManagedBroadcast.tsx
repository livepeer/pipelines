"use client";

import { BroadcastWithControls } from "@/components/playground/broadcast";
import { useDreamshaperStore } from "@/hooks/useDreamshaper";
import useFullscreenStore from "@/hooks/useFullscreenStore";
import useMobileStore from "@/hooks/useMobileStore";
import { cn } from "@repo/design-system/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface ManagedBroadcastProps {
  outputPlayerRef: React.RefObject<HTMLDivElement>;
}

export function ManagedBroadcast({ outputPlayerRef }: ManagedBroadcastProps) {
  const { isMobile } = useMobileStore();
  const { isFullscreen } = useFullscreenStore();
  const { stream, streamUrl, pipeline, loading } = useDreamshaperStore();
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

      const broadcastPositioning = () => {
        updatePlayerPosition();

        const delays = [50, 100, 300, 500, 1000];
        const timeouts = delays.map(delay =>
          setTimeout(updatePlayerPosition, delay),
        );

        return () => timeouts.forEach(clearTimeout);
      };

      const cleanupInitialPositioning = broadcastPositioning();

      window.addEventListener("resize", updatePlayerPosition);
      window.addEventListener("scroll", updatePlayerPosition);
      document.addEventListener("DOMContentLoaded", updatePlayerPosition);
      window.addEventListener("load", updatePlayerPosition);

      const resizeObserver = new ResizeObserver(() => {
        updatePlayerPosition();
      });

      resizeObserver.observe(outputPlayerRef.current);

      const bodyObserver = new MutationObserver(updatePlayerPosition);
      bodyObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
      });

      return () => {
        cleanupInitialPositioning();
        window.removeEventListener("resize", updatePlayerPosition);
        window.removeEventListener("scroll", updatePlayerPosition);
        document.removeEventListener("DOMContentLoaded", updatePlayerPosition);
        window.removeEventListener("load", updatePlayerPosition);
        resizeObserver.disconnect();
        bodyObserver.disconnect();
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
            streamId={stream?.id}
            pipelineId={pipeline?.id}
            pipelineType={pipeline?.type}
          />
        </div>
      )}
    </div>
  );
}
