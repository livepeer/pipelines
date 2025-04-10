import { cn } from "@repo/design-system/lib/utils";
import { useEffect, useRef } from "react";
import useClipsFetcher, { Clip } from "./hooks/useClipsFetcher";
import LoadingSpinner from "./LoadingSpinner";
import OptimizedVideo from "./OptimizedVideo";

enum GridSetConfiguration {
  first = "lg:grid-cols-[9fr_5fr_6fr]",
  second = "lg:grid-cols-[5fr_6fr_9fr]",
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

export default function BentoGrids() {
  const { clips, loading, hasMore, fetchClips } = useClipsFetcher();
  const loadingRef = useRef<HTMLDivElement>(null);
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchClips();
      initialFetchDone.current = true;
    }
  }, [fetchClips]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && initialFetchDone.current) {
          fetchClips();
        }
      },
      { threshold: 0.1 },
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [fetchClips, loading]);

  const clipSets = [];
  for (let i = 0; i < clips.length; i += 4) {
    if (i + 3 < clips.length) {
      clipSets.push(clips.slice(i, i + 4));
    }
  }

  return (
    <div className="bg-gray-50 py-8 z-10">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          style={{
            backgroundImage: "url(/background.png)",
          }}
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        />
      </div>
      <div className="mx-auto px-8 lg:px-12 h-fit">
        <p className="mx-auto mt-2 max-w-lg text-balance text-center text-4xl font-extralight tracking-tight text-gray-950 sm:text-6xl">
          Discover how Others{" "}
          <span className="font-playfair font-bold">daydream</span>
        </p>
        <h2 className="text-center text-base/7 font-light text-zinc-500 max-w-lg mx-auto mt-6 leading-[135%]">
          Explore work from the most talented and accomplished designers ready
          to take on your next project
        </h2>

        {clipSets.map((set, setIndex) => {
          const configIndex = setIndex % 2;
          const configuration = [
            GridSetConfiguration.first,
            GridSetConfiguration.second,
          ][configIndex];

          return (
            <GridSet
              key={`set-${setIndex}`}
              configuration={configuration}
              className={setIndex === 0 ? "mt-10 sm:mt-16" : ""}
            >
              <GridItem src={set[0].src} className="lg:row-span-2" />
              <GridItem src={set[1].src} className="max-lg:row-start-1" />
              <GridItem
                src={set[2].src}
                className="max-lg:row-start-3 lg:col-start-2 lg:row-start-2"
              />
              <GridItem src={set[3].src} className="lg:row-span-2" />
            </GridSet>
          );
        })}

        <div ref={loadingRef} className="py-8 text-center">
          {loading ? (
            <LoadingSpinner />
          ) : hasMore ? (
            <p className="text-gray-500 font-light">Scroll for more</p>
          ) : (
            <p className="text-gray-500 font-light">No more clips</p>
          )}
        </div>
      </div>
    </div>
  );
}

function GridItem({ src, className }: { src: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-px rounded-xl bg-white "></div>
      <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.xl)+1px)]">
        <OptimizedVideo src={src} />
      </div>
      <div className="pointer-events-none absolute inset-px rounded-xl shadow ring-1 ring-black/5"></div>
    </div>
  );
}
