import { getPipeline } from "@/app/api/pipelines/get";

export default async function Page(props: {
  params: { id: string };
  searchParams: { edit: string };
}) {
  const pipelineId = props.params.id;
  const isEditMode = props.searchParams.edit === "true";
  const pipeline = await getPipeline(pipelineId);
  return <div>Pipeline {pipeline.name}</div>;
}
