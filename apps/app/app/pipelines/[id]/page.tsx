import { getPipeline } from "@/app/api/pipelines/get";
import CreatePipeline from "@/components/pipeline/create-pipeline";
import EditPipeline from "@/components/pipeline/edit-pipeline";
import ValidatePipeline from "@/components/pipeline/validate-pipeline";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ streamId: string; validation: string }>;
}) {
  const pipelineId = (await params).id;
  const isSearchMode = pipelineId === "create";
  const { streamId, validation } = await searchParams;
  const isValidationMode = validation === "true";

  if (isSearchMode) {
    return <CreatePipeline />;
  }

  if (isValidationMode) {
    return <ValidatePipeline pipelineId={pipelineId} streamId={streamId} />;
  }

  const pipeline = await getPipeline(pipelineId);

  return <EditPipeline pipeline={pipeline} />;
}
