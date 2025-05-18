"use client";

import { useEffect, useState, useRef } from "react";
import { useOverlayStore } from "@/hooks/useOverlayStore";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CopyIcon,
  Lightbulb,
  Check,
} from "lucide-react";
import { Button } from "@repo/design-system/components/ui/button";
import { useDreamshaperStore, useStreamUpdates } from "@/hooks/useDreamshaper";
import { usePromptStore } from "@/hooks/usePromptStore";
import { useGuestUserStore } from "@/hooks/useGuestUser";
import { usePrivy } from "@/hooks/usePrivy";
import track from "@/lib/track";
import { cn } from "@repo/design-system/lib/utils";
import { OverlayClipViewer } from "./OverlayClipViewer";
import { setSourceClipIdToCookies } from "@/components/daydream/Clipping/actions";
import { GridVideoItem } from "./GridVideoItem";
import useMobileStore from "@/hooks/useMobileStore";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@repo/design-system/components/ui/tabs";

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
    setIsOverlayOpen,
  } = useOverlayStore();
  const { stream } = useDreamshaperStore();
  const { handleStreamUpdate } = useStreamUpdates();
  const { setLastSubmittedPrompt, setHasSubmittedPrompt } = usePromptStore();
  const { setIsGuestUser, setLastPrompt, incrementPromptCount } =
    useGuestUserStore();
  const { authenticated, user } = usePrivy();
  const [initialClips, setInitialClips] = useState<any[]>([]);
  const [myClips, setMyClips] = useState<any[]>([]);
  const [selectedClip, setSelectedClip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMyClips, setIsLoadingMyClips] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useMobileStore();
  const [copiedClipId, setCopiedClipId] = useState<string | null>(null);

  const initialOpenRef = useRef(true);
  const scrollRestoredRef = useRef(false);

  useEffect(() => {
    if (initialOpenRef.current) {
      if (isMobile) {
        setIsOverlayOpen(false);
      }
      initialOpenRef.current = false;
    }
  }, [isMobile, setIsOverlayOpen]);

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
        setIsLoading(true);
        fetch("/api/clips?page=0&limit=48")
          .then(res => res.json())
          .then(data => {
            const clips = data.clips || [];
            setInitialClips(clips);
            setCachedClips(clips);
            setIsLoading(false);
          })
          .catch(error => {
            console.error("Error fetching clips:", error);
            setIsLoading(false);
          });
      }

      if (authenticated && user) {
        setIsLoadingMyClips(true);
        fetch(`/api/clips/user?page=0&limit=48`)
          .then(res => res.json())
          .then(data => {
            setMyClips(data.clips);
            setIsLoadingMyClips(false);
          })
          .catch(error => {
            console.error("Error fetching user clips:", error);
            setIsLoadingMyClips(false);
          });
      }
    }

    if (!isOverlayOpen) {
      initialOpenRef.current = true;
      scrollRestoredRef.current = false;
    }
  }, [isOverlayOpen, overlayType, cachedClips, setCachedClips, authenticated]);

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
        // Only prevent default if scrolling inside the overlay
        if (overlayRef.current?.contains(e.target as Node)) {
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

      // closeOverlay();
    }
  };

  const handleBackButton = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (overlayType === "clip") {
      setOverlayType("bento");
      setSelectedClipId(null);
    } else {
      closeOverlay();
    }
  };

  if (!isOverlayOpen) {
    return (
      <div
        ref={overlayRef}
        className={cn(
          isMobile
            ? "fixed bottom-0 left-0 right-0 h-0 z-[100] overflow-y-auto overflow-x-visible overscroll-contain bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 shadow-lg opacity-0 pointer-events-none"
            : "fixed right-0 w-[35%] inset-y-0 z-[100] overflow-y-auto overflow-x-visible overscroll-contain bg-white dark:bg-black border-l border-gray-200 dark:border-gray-800 shadow-lg opacity-0 pointer-events-none",
        )}
        style={{ visibility: "hidden" }}
      />
    );
  }

  return (
    <>
      <div
        className={cn(
          "fixed z-[201]",
          isMobile
            ? "bottom-[40vh] left-1/2 transform -translate-x-1/2 translate-y-[20px]"
            : "left-[65%] top-1/2 transform -translate-x-1/2 -translate-y-1/2",
        )}
        style={{
          filter:
            "drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))",
        }}
        onClick={e => {
          e.stopPropagation();
          closeOverlay();
        }}
      >
        <button
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close sidebar"
        >
          {isMobile ? (
            <ChevronDown className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>
      </div>

      <div
        ref={overlayRef}
        className={cn(
          "fixed z-[100] overflow-y-auto overflow-x-visible overscroll-contain bg-white dark:bg-black transition-all duration-150",
          isMobile
            ? "inset-x-0 bottom-0 h-[40vh] border-[8px] border-solid border-[#ededed] dark:border-[#ededed] border-b-0 rounded-t-[30px] shadow-[0_-12px_25px_-5px_rgba(0,0,0,0.25)]"
            : "right-0 w-[35%] inset-y-0 border-l border-gray-200 dark:border-gray-800 shadow-lg",
          isOverlayOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={e => {
          e.stopPropagation();
        }}
        onScroll={() => {
          scrollRestoredRef.current = true;
        }}
      >
        <div className="absolute inset-0 bg-white dark:bg-black pointer-events-none"></div>

        <div className="relative z-10 h-full">
          {overlayType === "bento" && (
            <div className="p-4">
              <Tabs defaultValue="trending" className="w-full mb-6">
                <TabsList className="w-full bg-transparent flex justify-evenly px-8">
                  <TabsTrigger
                    value="trending"
                    className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="font-medium text-sm sm:text-base md:text-lg">
                          Trending styles
                        </h2>
                      </div>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="my-clips"
                    className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="font-medium text-sm sm:text-base md:text-lg">
                          My Clips
                        </h2>
                      </div>
                    </div>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="trending" className="py-4">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-t-primary rounded-full animate-spin"></div>
                    </div>
                  ) : initialClips.length > 0 ? (
                    <div className="max-w-7xl mx-auto px-4 lg:px-8">
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-md px-4 py-2 mb-4 w-full max-w-xl mx-auto">
                        <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-200 text-sm">
                          Click a filter to apply it instantly
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {initialClips.map(clip => (
                          <GridVideoItem
                            key={clip.id}
                            clip={clip}
                            onTryPrompt={handleTryPrompt}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center py-8">
                      No clips available
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="my-clips" className="py-4">
                  {!authenticated ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <h3 className="text-lg font-medium mb-2">
                        No clips here!
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Create an account to save and manage your clips
                      </p>
                      <Button
                        variant="outline"
                        className={cn("alwaysAnimatedButton", "px-4")}
                        onClick={() => {
                          // Reset guest user state to ensure they can sign in
                          setIsGuestUser(false);
                        }}
                      >
                        Sign in
                      </Button>
                    </div>
                  ) : isLoadingMyClips ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-t-primary rounded-full animate-spin"></div>
                    </div>
                  ) : myClips.length > 0 ? (
                    <div className="max-w-7xl mx-auto px-4 lg:px-8">
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-md px-4 py-2 mb-4 w-full max-w-xl mx-auto">
                        <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-200 text-sm">
                          Click on a clip to apply its style
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {myClips.map(clip => (
                          <div key={clip.id} className="relative group">
                            <GridVideoItem
                              clip={clip}
                              onTryPrompt={handleTryPrompt}
                            />
                            <div className="absolute top-3 right-3 p-0 z-30">
                              <Button
                                size="sm"
                                className={cn(
                                  "text-white text-[0.64rem] bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg whitespace-nowrap overflow-hidden text-ellipsis max-w-full",
                                )}
                                onClick={e => {
                                  e.stopPropagation();
                                  const link = `${window.location.origin}/clips/${clip.slug}`;
                                  navigator.clipboard.writeText(link);
                                  setCopiedClipId(clip.id);
                                  setTimeout(() => setCopiedClipId(null), 3000);
                                }}
                              >
                                Copy Link
                                {copiedClipId === clip.id ? (
                                  <Check className="w-4 h-4 ml-1 text-green-400" />
                                ) : (
                                  <CopyIcon className="w-4 h-4 ml-1" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center py-8">
                      <div className="text-center">
                        <h3 className="text-lg font-medium mb-2">
                          No clips yet
                        </h3>
                        <p className="text-sm text-gray-500">
                          Create your first clip to see it here
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {overlayType === "clip" && selectedClip && (
            <div
              className="h-screen flex justify-center items-center p-4"
              onClick={e => {
                if (e.target === e.currentTarget) {
                  setOverlayType("bento");
                  setSelectedClipId(null);
                }
              }}
            >
              <div className="absolute top-4 left-4 z-50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOverlayType("bento");
                    setSelectedClipId(null);
                  }}
                  className="h-8 gap-2 rounded-md"
                  aria-label="Back to clips"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back to clips</span>
                </Button>
              </div>

              <OverlayClipViewer
                clip={selectedClip}
                onTryPrompt={handleTryPrompt}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
