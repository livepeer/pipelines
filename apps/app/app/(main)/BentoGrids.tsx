"use client";

import { usePreviewStore } from "@/hooks/usePreviewStore";
import { cn } from "@repo/design-system/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { useTrackEvent } from "@/hooks/useTrackEvent";
import useClipsFetcher from "./hooks/useClipsFetcher";
import LoadingSpinner from "./LoadingSpinner";
import NoMoreClipsFooter from "./NoMoreClipsFooter";
import OptimizedVideo from "./OptimizedVideo";
import { useOverlayStore } from "@/hooks/useOverlayStore";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@repo/design-system/components/ui/button";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { TrackedButton } from "@/components/analytics/TrackedButton";
import Link from "next/link";
import { usePrivy } from "@/hooks/usePrivy";

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export interface BentoGridsProps {
  initialClips: Array<{
    id: string;
    video_url: string;
    video_title: string | null;
    created_at: string;
    prompt?: string;
    author_name: string | null;
    remix_count: number;
    slug: string | null;
    priority: number | null;
    is_tutorial?: boolean;
  }>;
  isOverlayMode?: boolean;
  onTryPrompt?: (prompt: string) => void;
  onClipsLoaded?: (clips: any[]) => void;
  hasCapacity?: boolean;
}

export function BentoGrids({
  initialClips,
  isOverlayMode = false,
  onTryPrompt,
  onClipsLoaded,
  hasCapacity = true,
}: BentoGridsProps) {
  const { clips, loading, hasMore, fetchClips, page } =
    useClipsFetcher(initialClips);
  const loadingRef = useRef<HTMLDivElement>(null);
  const initialFetchDone = useRef(false);
  const { isPreviewOpen } = usePreviewStore();
  const { trackAction } = useTrackEvent("explore_scroll_interaction", {
    location: "explore_bento_grid_scroll",
  });
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const { authenticated } = usePrivy();

  const searchParams = useSearchParams();
  const isDebug = searchParams.has("debug");

  useEffect(() => {
    if (onClipsLoaded && clips.length > 0) {
      onClipsLoaded(clips);
    }
  }, [clips, onClipsLoaded]);

  useEffect(() => {
    if (!initialFetchDone.current) {
      if (
        isOverlayMode &&
        initialClips.length > 0 &&
        initialClips.length < 16
      ) {
        fetchClips();
      } else if (!isOverlayMode || initialClips.length === 0) {
        fetchClips();
      }
      initialFetchDone.current = true;
    }
  }, [fetchClips, isOverlayMode, initialClips.length]);

  useEffect(() => {
    if (isOverlayMode && initialClips.length >= 16) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          trackAction("explore_clips_loaded_on_scroll", {
            page_index: page,
          });
          fetchClips();
        }
      },
      { threshold: 0.1 },
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [
    fetchClips,
    loading,
    hasMore,
    page,
    trackAction,
    isOverlayMode,
    initialClips.length,
  ]);

  const groupedClips = chunkArray(clips, 4);

  return (
    <div className="bg-transparent py-4">
      <div className="relative z-10">
        {/* Header Text with Discord Button */}
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-2xl font-light tracking-tight">Community Creations</h2>
          <Link target="_blank" href="https://discord.com/invite/hxyNHeSzCK">
            <TrackedButton
              trackingEvent="daydream_join_community_clicked"
              trackingProperties={{
                is_authenticated: authenticated,
                location: "bento_grid_header",
              }}
              variant="outline"
              className="alwaysAnimatedButton rounded-md"
              size="sm"
            >
              <DiscordLogoIcon className="h-6 w-6" /> 
            </TrackedButton>
          </Link>
        </div>
        {/* Subheader */}
        <div className="mb-4">
          <p className="text-base text-gray-500">Click on a clip to try the prompt</p>
        </div>

        {/* Mobile Collapsible Header */}
        <div className="lg:hidden">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-4 text-lg font-light"
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          >
            <span>Explore prompts</span>
            {isMobileExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Carousel */}
        <div
          className={cn(
            "lg:hidden overflow-x-auto pb-4",
            isMobileExpanded ? "block" : "hidden"
          )}
        >
          <div className="flex gap-4 px-4">
            {clips.map((clip, index) => (
              <div
                key={clip.id}
                className="flex-none w-[280px] aspect-square"
              >
                <GridItem
                  clipId={clip.id}
                  slug={clip.slug}
                  title={clip.video_title || "Vincent Van Gogh"}
                  authorName={clip.author_name || "Livepeer"}
                  authorDetails={clip.author_details as Record<string, any>}
                  src={clip.video_url}
                  prompt={clip.prompt}
                  createdAt={clip.created_at}
                  remixCount={clip.remix_count}
                  isTutorial={clip.is_tutorial}
                  className="w-full h-full"
                  isDebug={isDebug}
                  overallIndex={index}
                  isOverlayMode={isOverlayMode}
                  onTryPrompt={onTryPrompt}
                  hasCapacity={hasCapacity}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden lg:block">
          {chunkArray(clips, 2).map((group, groupIndex) => (
            <div
              key={groupIndex}
              className="grid grid-cols-2 gap-4 mt-4"
            >
              {group.map((clip, index) => {
                const overallIndex = groupIndex * 2 + index;
                return (
                  <GridItem
                    key={clip.id}
                    clipId={clip.id}
                    slug={clip.slug}
                    title={clip.video_title || "Vincent Van Gogh"}
                    authorName={clip.author_name || "Livepeer"}
                    authorDetails={clip.author_details as Record<string, any>}
                    src={clip.video_url}
                    prompt={clip.prompt}
                    createdAt={clip.created_at}
                    remixCount={clip.remix_count}
                    isTutorial={clip.is_tutorial}
                    className="aspect-square"
                    isDebug={isDebug}
                    overallIndex={overallIndex}
                    isOverlayMode={isOverlayMode}
                    onTryPrompt={onTryPrompt}
                    hasCapacity={hasCapacity}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div ref={loadingRef} className="py-4 text-center relative z-50">
          {loading ? (
            <LoadingSpinner />
          ) : hasMore && (!isOverlayMode || initialClips.length === 0) ? (
            <p className="text-gray-500 font-light">Scroll for more</p>
          ) : (
            <NoMoreClipsFooter isOverlayMode={isOverlayMode} />
          )}
        </div>
      </div>
    </div>
  );
}

function GridItem({
  clipId,
  src,
  prompt,
  className,
  slug,
  title,
  authorName,
  authorDetails,
  createdAt,
  remixCount,
  isDebug,
  overallIndex,
  isOverlayMode = false,
  onTryPrompt,
  hasCapacity,
  isTutorial,
}: {
  clipId: string;
  src: string;
  prompt?: string;
  className?: string;
  slug: string | null;
  title: string;
  authorName: string;
  createdAt: string;
  remixCount: number;
  isDebug: boolean;
  overallIndex: number;
  isOverlayMode?: boolean;
  authorDetails?: Record<string, any>;
  onTryPrompt?: (prompt: string) => void;
  hasCapacity?: boolean;
  isTutorial?: boolean;
}) {
  const href = slug ? `/clip/${slug}` : `/clip/id/${clipId}`;
  const { isPreviewOpen } = usePreviewStore();
  const { setIsOverlayOpen, setOverlayType, setSelectedClipId } =
    useOverlayStore();

  const handleClick = (e: React.MouseEvent) => {
    if (isOverlayMode) {
      e.preventDefault();
      setSelectedClipId(clipId);
      setOverlayType("clip");
      setIsOverlayOpen(true);
    }
  };

  return (
    <div
      className={cn(
        "relative aspect-square block",
        className,
      )}
    >
      {isDebug && (
        <div className="absolute top-1 left-1 z-40 bg-black/60 text-white text-xs font-mono px-1.5 py-0.5 rounded">
          #{overallIndex + 1}
        </div>
      )}

      <div className="absolute inset-px rounded-xl loading-gradient z-0"></div>
      <div className="absolute inset-px rounded-xl backdrop-blur-[125px] z-10"></div>
      <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.xl)+1px)] z-20">
        <OptimizedVideo
          src={src}
          clipId={clipId}
          prompt={prompt}
          title={title}
          slug={slug}
          authorName={authorName}
          authorDetails={authorDetails}
          createdAt={createdAt}
          remixCount={remixCount}
          isOverlayMode={isOverlayMode}
          onTryPrompt={onTryPrompt}
          hasCapacity={hasCapacity}
          isTutorial={isTutorial}
        />
      </div>

      <div className="pointer-events-none absolute inset-px rounded-xl shadow ring-1 ring-black/5 z-30"></div>
    </div>
  );
}

enum GridSetConfiguration {
  first = "lg:grid-cols-[9fr_5fr_6fr]",
  second = "lg:grid-cols-[5fr_6fr_9fr]",
  third = "lg:grid-cols-[6fr_9fr_5fr]",
}

type GridSetProps = {
  children: React.ReactNode;
  configuration: GridSetConfiguration;
  className?: string;
};

function GridSet({ children, configuration, className }: GridSetProps) {
  return (
    <div
      className={cn("mt-4 grid gap-4 lg:grid-rows-2", configuration, className)}
    >
      {children}
    </div>
  );
}
