import { getPipeline } from "@/app/api/pipelines/get";
import PlaygroundClient from "./PlaygroundClient";

export default async function Playground({
  searchParams,
  params,
}: {
  searchParams: Promise<any>;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pipeline = await getPipeline(id);

  return (
    <div className="flex flex-col h-[calc(100%-1rem)] border border-border p-4">
      {pipeline && (
        <PlaygroundClient
          pipelineData={pipeline}
          pipelineId={id}
          searchParams={await searchParams}
        />
      )}
    </div>
  );
}
