import { getPipeline } from "@/app/api/pipelines/get";
import CreatePipeline from "@/components/pipeline/create-pipeline";
import EditPipeline from "@/components/pipeline/edit-pipeline";
import ValidatePipeline from "@/components/pipeline/validate-pipeline";

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

  const pipeline = await getPipeline(pipelineId);

  return <EditPipeline pipeline={pipeline} />;
}
