import { getPipeline } from "@/app/api/pipelines/get";
import CreatePipeline from "@/components/pipeline/create-pipeline";
import EditPipeline from "@/components/pipeline/edit-pipeline";
import ValidatePipeline from "@/components/pipeline/validate-pipeline";
import { Metadata } from "next";
import { cache } from "react";

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

  // Return default metadata for create page
  if (pipelineId === "create") {
    return {
      title: "Livepeer Pipelines | Create Pipeline",
      openGraph: {
        title: "Create New Pipeline",
        description: "Create a new video processing pipeline on Livepeer",
        type: "website",
        siteName: "Livepeer Pipelines",
        url: pipelineUrl,
      },
    };
  }

  // Fetch pipeline data for existing pipeline
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

export default async function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { streamId: string; validation: string };
}) {
  const pipelineId = params.id;
  const isSearchMode = pipelineId === "create";
  const isValidationMode = searchParams.validation === "true";

  if (isSearchMode) {
    return <CreatePipeline />;
  }

  if (isValidationMode) {
    return (
      <ValidatePipeline
        pipelineId={pipelineId}
        streamId={searchParams.streamId}
      />
    );
  }

  const pipeline = await getCachedPipeline(pipelineId);

  return <EditPipeline pipeline={pipeline} />;
}
