"use client";

import { usePreviewStore } from "@/hooks/usePreviewStore";
import { cn } from "@repo/design-system/lib/utils";
import { useEffect, useRef } from "react";
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
  }>;
}

export function BentoGrids({ initialClips }: BentoGridsProps) {
  const { clips, loading, hasMore, fetchClips } = useClipsFetcher(initialClips);
  const loadingRef = useRef<HTMLDivElement>(null);
  const initialFetchDone = useRef(false);
  const { isPreviewOpen } = usePreviewStore();

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
          fetchClips();
        }
      },
      { threshold: 0.1 },
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [fetchClips, loading, hasMore]);

  const groupedClips = chunkArray(clips, 4);

  return (
    <div className="bg-transparent py-8 z-10">
      <div
        aria-hidden="true"
        className="fixed inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-60"
      >
        <div
          style={{
            backgroundImage: "url(/background.png)",
          }}
          className="w-[90vw] h-[50vh] mx-auto bg-cover bg-center opacity-40"
        />
      </div>
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <p
          className={cn(
            "mx-auto mt-2 max-w-lg text-balance text-center text-4xl font-extralight tracking-tight text-gray-950 sm:text-6xl",
            isPreviewOpen && "opacity-0",
          )}
        >
          Discover how others{" "}
          <span className="font-playfair font-bold text-5xl sm:text-7xl">
            daydream
          </span>
        </p>
        <h2
          className={cn(
            "text-center text-base/7 font-light text-zinc-500 max-w-lg mx-auto mt-6 leading-[135%]",
            isPreviewOpen && "opacity-0",
          )}
        >
          Explore a world where imagination becomes reality
          <br />
          and bring your own vision to life
        </h2>

        {groupedClips.map((group, groupIndex) => {
          const configuration =
            groupIndex % 2 === 0
              ? GridSetConfiguration.first
              : GridSetConfiguration.second;

          return (
            <GridSet
              key={groupIndex}
              configuration={configuration}
              className={groupIndex === 0 ? "mt-10 sm:mt-16" : "mt-4"}
            >
              {group.map((clip, index) => {
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
  key,
  clipId,
  src,
  prompt,
  className,
  slug,
  title,
  authorName,
  createdAt,
  remixCount,
}: {
  key: string;
  clipId: string;
  src: string;
  prompt?: string;
  className?: string;
  slug: string | null;
  title: string;
  authorName: string;
  createdAt: string;
  remixCount: number;
}) {
  return (
    <div
      className={cn(
        "relative aspect-square lg:min-h-[300px] lg:aspect-auto",
        className,
      )}
    >
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
      <div className="pointer-events-none absolute inset-px rounded-xl shadow ring-1 ring-black/5 z-30"></div>
    </div>
  );
}

// TODO: More systematic grid confituration
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
