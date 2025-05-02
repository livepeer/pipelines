"use client";

import { useEffect, useState, useRef } from "react";
import { useOverlayStore } from "@/hooks/useOverlayStore";
import { BentoGrids } from "@/app/(main)/BentoGrids";
import { ChevronLeft } from "lucide-react";
import { Button } from "@repo/design-system/components/ui/button";
import { useDreamshaperStore, useStreamUpdates } from "@/hooks/useDreamshaper";
import { usePromptStore } from "@/hooks/usePromptStore";
import { useGuestUserStore } from "@/hooks/useGuestUser";
import { usePrivy } from "@/hooks/usePrivy";
import track from "@/lib/track";
import { cn } from "@repo/design-system/lib/utils";
import { OverlayClipViewer } from "./OverlayClipViewer";
import { setSourceClipIdToCookies } from "@/components/daydream/Clipping/actions";

export const BentoGridOverlay = () => {
  const {
    isOverlayOpen,
    overlayType,
    selectedClipId,
    cachedClips,
    scrollPosition,
    closeOverlay,
    setCachedClips,
    setScrollPosition,
    setOverlayType,
    setSelectedClipId,
  } = useOverlayStore();
  const { stream } = useDreamshaperStore();
  const { handleStreamUpdate } = useStreamUpdates();
  const { setLastSubmittedPrompt, setHasSubmittedPrompt } = usePromptStore();
  const { setLastPrompt, incrementPromptCount } = useGuestUserStore();
  const { authenticated } = usePrivy();
  const [initialClips, setInitialClips] = useState<any[]>([]);
  const [selectedClip, setSelectedClip] = useState<any>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const initialOpenRef = useRef(true);
  const scrollRestoredRef = useRef(false);

  const handleReportClips = (loadedClips: any[]) => {
    if (loadedClips.length > cachedClips.length) {
      setCachedClips(loadedClips);
    }
  };

  const restoreScrollPosition = () => {
    if (
      scrollPosition > 0 &&
      !scrollRestoredRef.current &&
      overlayRef.current
    ) {
      setTimeout(() => {
        if (overlayRef.current) {
          overlayRef.current.scrollTop = scrollPosition;
          scrollRestoredRef.current = true;
        }
      }, 100);
    }
  };

  useEffect(() => {
    if (isOverlayOpen && overlayType === "bento") {
      if (cachedClips.length > 0) {
        setInitialClips(cachedClips);
        scrollRestoredRef.current = false;
        restoreScrollPosition();
      } else {
        fetch("/api/clips?page=0&limit=96")
          .then(res => res.json())
          .then(data => {
            const clips = data.clips || [];
            setInitialClips(clips);
            setCachedClips(clips);
          })
          .catch(error => {
            console.error("Error fetching clips:", error);
          });
      }
    }

    if (!isOverlayOpen) {
      initialOpenRef.current = true;
      scrollRestoredRef.current = false;
    }
  }, [isOverlayOpen, overlayType, cachedClips, setCachedClips]);

  useEffect(() => {
    if (isOverlayOpen && overlayType === "bento" && overlayRef.current) {
      let scrollTimeout: NodeJS.Timeout;

      const handleScroll = () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);

        scrollTimeout = setTimeout(() => {
          if (overlayRef.current) {
            setScrollPosition(overlayRef.current.scrollTop);
          }
        }, 100);
      };

      overlayRef.current.addEventListener("scroll", handleScroll, {
        passive: true,
      });

      return () => {
        if (overlayRef.current) {
          overlayRef.current.removeEventListener("scroll", handleScroll);
        }
        if (scrollTimeout) clearTimeout(scrollTimeout);
      };
    }
  }, [isOverlayOpen, overlayType, setScrollPosition]);

  useEffect(() => {
    if (isOverlayOpen && overlayType === "clip" && selectedClipId) {
      fetch(`/api/clips/${selectedClipId}`)
        .then(res => res.json())
        .then(data => {
          setSelectedClip(data);
        })
        .catch(error => {
          console.error("Error fetching clip details:", error);
        });
    } else {
      setSelectedClip(null);
    }
  }, [isOverlayOpen, overlayType, selectedClipId]);

  useEffect(() => {
    if (isOverlayOpen && overlayType === "bento" && overlayRef.current) {
      const handleWheel = (e: WheelEvent) => {
        if (overlayRef.current) {
          overlayRef.current.scrollTop += e.deltaY;
          e.preventDefault();
        }
      };

      document.addEventListener("wheel", handleWheel, { passive: false });

      return () => {
        document.removeEventListener("wheel", handleWheel);
      };
    }
  }, [isOverlayOpen, overlayType]);

  const handleTryPrompt = (prompt: string) => {
    if (prompt && handleStreamUpdate) {
      handleStreamUpdate(prompt, { silent: true });
      setLastSubmittedPrompt(prompt);
      setHasSubmittedPrompt(true);
      setLastPrompt(prompt);

      if (!authenticated) {
        incrementPromptCount();
      }

      track("overlay_try_prompt_clicked", {
        is_authenticated: authenticated,
        prompt: prompt,
        stream_id: stream?.id,
        source: "overlay_bento",
      });

      closeOverlay();
    }
  };

  const handleBackButton = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (overlayType === "clip") {
      // If in clip view, go back to bento grid
      setOverlayType("bento");
      setSelectedClipId(null);
    } else {
      // Otherwise close the overlay completely
      closeOverlay();
    }
  };

  if (!isOverlayOpen) {
    return (
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-white dark:bg-black opacity-0 pointer-events-none"
        style={{ visibility: "hidden" }}
      />
    );
  }

  return (
    <div
      ref={overlayRef}
      className={cn(
        "fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-white dark:bg-black",
        "transition-opacity duration-150",
        isOverlayOpen ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
      onClick={e => {
        e.stopPropagation();
      }}
      onScroll={() => {
        scrollRestoredRef.current = true;
      }}
    >
      <div className="absolute inset-0 bg-transparent pointer-events-none"></div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 transform-gpu overflow-hidden sm:-top-60 z-0 pointer-events-none"
      >
        <div
          style={{
            backgroundImage: "url(/background.png)",
            maskImage:
              "linear-gradient(to bottom, black 60%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 60%, transparent 100%)",
          }}
          className="w-full h-[70vh] mx-auto bg-cover bg-center opacity-50"
        />
      </div>

      <div
        className="absolute inset-0 backdrop-blur z-0 pointer-events-none"
        style={{ background: "transparent!important" }}
      ></div>

      <header
        className={cn(
          "sticky top-0 z-[51] transition-colors duration-300 ease-in-out w-full",
          overlayType === "clip"
            ? "bg-transparent"
            : "bg-transparent backdrop-filter backdrop-blur-xl",
        )}
        onClick={e => e.stopPropagation()}
        style={{ background: "transparent!important" }}
      >
        <div className="w-full flex items-center justify-start py-4 px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackButton}
            className="h-8 gap-2 rounded-md"
            aria-label={overlayType === "clip" ? "Back" : "Continue creating"}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{overlayType === "clip" ? "Back" : "Continue creating"}</span>
          </Button>
        </div>
      </header>

      <div className="relative z-10 h-full">
        {overlayType === "bento" && (
          <div className="p-4">
            {initialClips.length > 0 ? (
              <BentoGrids
                initialClips={initialClips}
                isOverlayMode={true}
                onTryPrompt={handleTryPrompt}
                onClipsLoaded={handleReportClips}
              />
            ) : (
              <div className="flex justify-center py-8"></div>
            )}
          </div>
        )}

        {overlayType === "clip" && selectedClipId && (
          <div
            className="h-screen flex justify-center items-center p-4"
            onClick={e => {
              if (e.target === e.currentTarget) {
                setOverlayType("bento");
                setSelectedClipId(null);
              }
            }}
          >
            {selectedClip ? (
              <OverlayClipViewer
                clip={{
                  id: selectedClipId,
                  url: selectedClip.url,
                  prompt: selectedClip.prompt,
                  title: selectedClip.title || "",
                  authorName: selectedClip.authorName || "Livepeer",
                  authorDetails: selectedClip.authorDetails,
                  createdAt: selectedClip.createdAt,
                }}
                onTryPrompt={handleTryPrompt}
              />
            ) : (
              <div className="flex items-center justify-center"></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
