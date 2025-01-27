import { getPipeline } from "@/app/api/pipelines/get";
import CreatePipeline from "@/components/pipeline/create-pipeline";

export default async function Page(props: {
  params: { id: string };
  searchParams: { edit: string };
}) {
  const pipelineId = props.params.id;
  const isEditMode = props.searchParams.edit === "true";
  const isSearchMode = pipelineId === "create";

  if (isSearchMode) {
    return <CreatePipeline />;
  }

  return <div>Pipeline `{pipelineId}`</div>;
}
