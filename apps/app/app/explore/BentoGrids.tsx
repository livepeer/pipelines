import { db } from "@/lib/db";
import { clips as clipsTable } from "@/lib/db/schema";
import { cn } from "@repo/design-system/lib/utils";
import { unstable_cache } from "next/cache";
import PlayOnHoverVideo from "./PlayOnHoverVideo";

const getClips = unstable_cache(
  async () => {
    return await db.select().from(clipsTable).orderBy(clipsTable.created_at);
  },
  ["clips"],
  { revalidate: 36000, tags: ["clips"] },
);

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export async function BentoGrids() {
  const clips = await getClips();
  const groupedClips = chunkArray(clips, 4);

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

        {groupedClips.map((group, groupIndex) => {
          const configuration =
            groupIndex % 2 === 0
              ? GridSetConfiguration.first
              : GridSetConfiguration.second;

          return (
            <GridSet
              key={groupIndex}
              configuration={configuration}
              className={groupIndex === 0 ? "mt-10 sm:mt-16" : "mt-8"}
            >
              {group.map((clip, index) => (
                <GridItem
                  key={clip.id || index}
                  src={clip.video_url}
                  className={index % 2 === 0 ? "lg:row-span-2" : ""}
                />
              ))}
            </GridSet>
          );
        })}
      </div>
    </div>
  );
}

function GridItem({ src, className }: { src: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-px rounded-xl bg-white"></div>
      <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.xl)+1px)]">
        <PlayOnHoverVideo src={src} />
      </div>
      <div className="pointer-events-none absolute inset-px rounded-xl shadow ring-1 ring-black/5"></div>
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
