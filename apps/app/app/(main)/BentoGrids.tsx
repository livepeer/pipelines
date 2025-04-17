"use client";

import { usePreviewStore } from "@/hooks/usePreviewStore";
import { cn } from "@repo/design-system/lib/utils";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { useTrackEvent } from "@/hooks/useTrackEvent";
import useClipsFetcher from "./hooks/useClipsFetcher";
import LoadingSpinner from "./LoadingSpinner";
import NoMoreClipsFooter from "./NoMoreClipsFooter";
import OptimizedVideo from "./OptimizedVideo";

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
  }>;
}

export function BentoGrids({ initialClips }: BentoGridsProps) {
  const { clips, loading, hasMore, fetchClips, page } =
    useClipsFetcher(initialClips);
  const loadingRef = useRef<HTMLDivElement>(null);
  const initialFetchDone = useRef(false);
  const { isPreviewOpen } = usePreviewStore();
  const { trackAction } = useTrackEvent("explore_scroll_interaction", {
    location: "explore_bento_grid_scroll",
  });

  const searchParams = useSearchParams();
  const isDebug = searchParams.has("debug");

  useEffect(() => {
    if (!initialFetchDone.current && initialClips.length === 0) {
      fetchClips();
      initialFetchDone.current = true;
    }
  }, [fetchClips, initialClips.length]);

  useEffect(() => {
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
  }, [fetchClips, loading, hasMore, page, trackAction]);

  const groupedClips = chunkArray(clips, 4);

  return (
    <div className="bg-transparent py-8 z-10">
      <div
        aria-hidden="true"
        className="fixed inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden sm:-top-60"
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

      {/* Backdrop blur layer */}
      <div className="fixed inset-0 backdrop-blur z-0"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 lg:px-12">
        <p
          className={cn(
            "mx-auto mt-2 max-w-lg text-balance text-center text-4xl font-extralight tracking-tight text-gray-950 sm:text-6xl",
            isPreviewOpen && "opacity-0",
          )}
        >
          Discover how others{" "}
          <span className="font-semibold text-4xl sm:text-6xl">Daydream</span>
        </p>
        <h2
          className={cn(
            "text-center text-base/7 font-light text-zinc-500 max-w-lg mx-auto mt-6 leading-[135%]",
            isPreviewOpen && "opacity-0",
          )}
        >
          Explore a world where imagination becomes reality
        </h2>

        {groupedClips.map((group, groupIndex) => {
          const configuration =
            groupIndex % 2 === 0
              ? GridSetConfiguration.first
              : GridSetConfiguration.second;

          const baseIndex = groupIndex * 4;

          return (
            <GridSet
              key={groupIndex}
              configuration={configuration}
              className={groupIndex === 0 ? "mt-10 sm:mt-16" : "mt-4"}
            >
              {group.map((clip, index) => {
                const overallIndex = baseIndex + index;
                return (
                  <GridItem
                    key={clip.id}
                    clipId={clip.id}
                    slug={clip.slug}
                    title={clip.video_title || "Vincent Van Gogh"}
                    authorName={clip.author_name || "Livepeer"}
                    src={clip.video_url}
                    prompt={clip.prompt}
                    createdAt={clip.created_at}
                    remixCount={clip.remix_count}
                    className={`${index % 2 === 0 ? "lg:row-span-2" : ""} cursor-pointer`}
                    isDebug={isDebug}
                    overallIndex={overallIndex}
                  />
                );
              })}
            </GridSet>
          );
        })}

        <div ref={loadingRef} className="py-8 text-center relative z-50">
          {loading ? (
            <LoadingSpinner />
          ) : hasMore ? (
            <p className="text-gray-500 font-light">Scroll for more</p>
          ) : (
            <NoMoreClipsFooter />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"
          />
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
  createdAt,
  remixCount,
  isDebug,
  overallIndex,
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
}) {
  const href = slug ? `/clip/${slug}` : `/clip/id/${clipId}`;

  return (
    <TrackedLink
      href={href}
      trackingEvent="explore_clip_clicked"
      trackingProperties={{
        clip_id: clipId,
        clip_slug: slug,
        clip_author_name: authorName,
        location: "explore_bento_grid",
      }}
      className={cn(
        "relative aspect-square lg:min-h-[300px] lg:aspect-auto block",
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
          title={title}
          slug={slug}
          authorName={authorName}
          createdAt={createdAt}
          remixCount={remixCount}
        />
      </div>
      <div className="absolute inset-0 z-10 flex items-end justify-between p-4 text-white">
        <div className="flex items-center space-x-2">
          <div className="text-sm font-light">{title}</div>
          <div className="text-sm font-light">{authorName}</div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-px rounded-xl shadow ring-1 ring-black/5 z-30"></div>
    </TrackedLink>
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
