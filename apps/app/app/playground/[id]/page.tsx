import { getPipeline } from "@/app/api/pipelines/get";
import Modals from "@/components/modals";
import PlaygroundRenderer from "./renderer";
import { cache } from "react";
import { Metadata } from "next";

// Cache the getPipeline function
const getCachedPipeline = cache(async (pipelineId: string) => {
  return getPipeline(pipelineId);
});

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const pipelineId = params.id;
  const pipelineUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pipelines/${pipelineId}`;

  const pipeline = await getCachedPipeline(pipelineId);

  return {
    title: `Livepeer Pipelines | ${pipeline.name}`,
    openGraph: {
      title: pipeline.name,
      description:
        pipeline.description || "Video processing pipeline on Livepeer",
      type: "website",
      siteName: "Livepeer Pipelines",
      url: pipelineUrl,
      images: pipeline.cover_image
        ? [{ url: pipeline.cover_image }]
        : undefined,
    },
  };
}

export default async function Playground({
  searchParams,
  params,
}: {
  searchParams: any;
  params: { id: string };
}) {
  const pipelineData = await getPipeline(params.id);

  return (
    <div className="flex flex-col h-[calc(100%-1rem)]  border border-border  p-4">
      {pipelineData && <PlaygroundRenderer pipelineData={pipelineData} />}
      <Modals searchParams={searchParams} />
    </div>
  );
}
