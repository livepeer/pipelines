import { getPipeline } from "@/app/api/pipelines/get";
import CreatePipeline from "@/components/pipeline/create-pipeline";
import EditPipeline from "@/components/pipeline/edit-pipeline";

export default async function Page({ params }: { params: { id: string } }) {
  const pipelineId = params.id;
  const isSearchMode = pipelineId === "create";

  if (isSearchMode) {
    return <CreatePipeline />;
  }

  const pipeline = await getPipeline(pipelineId);

  return <EditPipeline pipeline={pipeline} />;
}
