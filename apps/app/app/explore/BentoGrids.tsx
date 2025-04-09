import { cn } from "@repo/design-system/lib/utils";
import PlayOnHoverVideo from "./PlayOnHoverVideo";

export default function BentoGrids() {
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
        <GridSet configuration={GridSetConfiguration.first}>
          <GridItem src="/explore-03.mp4" className="lg:row-span-2" />
          <GridItem src="/explore-02.mov" className="max-lg:row-start-1" />
          <GridItem
            src="/explore-01.mov"
            className="max-lg:row-start-3 lg:col-start-2 lg:row-start-2"
          />
          <GridItem src="/daydream.mp4" className="lg:row-span-2" />
        </GridSet>
        <GridSet configuration={GridSetConfiguration.second}>
          <GridItem src="/explore-01.mov" className="lg:row-span-2" />
          <GridItem src="/explore-03.mp4" className="max-lg:row-start-1 h-80" />
          <GridItem
            src="/daydream.mp4"
            className="max-lg:row-start-3 lg:col-start-2 lg:row-start-2 h-80"
          />
          <GridItem src="/explore-02.mov" className="lg:row-span-2" />
        </GridSet>
        <GridSet configuration={GridSetConfiguration.third}>
          <GridItem src="/explore-03.mp4" className="lg:row-span-2" />
          <GridItem src="/explore-02.mov" className="max-lg:row-start-1" />
          <GridItem
            src="/explore-01.mov"
            className="max-lg:row-start-3 lg:col-start-2 lg:row-start-2"
          />
          <GridItem src="/daydream.mp4" className="lg:row-span-2" />
        </GridSet>
      </div>
    </div>
  );
}

function GridItem({ src, className }: { src: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-px rounded-xl bg-white "></div>
      <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.xl)+1px)]">
        <PlayOnHoverVideo src={src} />
      </div>
      <div className="pointer-events-none absolute inset-px rounded-xl shadow ring-1 ring-black/5"></div>
    </div>
  );
}

enum GridSetConfiguration {
  first = "9fr_5fr_6fr",
  second = "5fr_6fr_9fr",
  third = "6fr_9fr_5fr",
}

type GridSetProps = {
  children: React.ReactNode;
  configuration?: GridSetConfiguration;
};

function GridSet({
  children,
  configuration = GridSetConfiguration.first,
}: GridSetProps) {
  return (
    <div
      className={cn(
        "mt-10 grid gap-4 sm:mt-16",
        `lg:grid-cols-[${configuration}] lg:grid-rows-2`,
      )}
    >
      {children}
    </div>
  );
}
