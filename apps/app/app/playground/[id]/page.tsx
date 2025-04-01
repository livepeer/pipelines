"use client";

import { getPipeline } from "@/app/api/pipelines/get";
import Modals from "@/components/modals";
import Form from "@/components/playground/form";
import Output from "@/components/playground/output";
import { usePrivy } from "@/hooks/usePrivy";
import track from "@/lib/track";
import { ScrollArea } from "@repo/design-system/components/ui/scroll-area";
import { useEffect, useState } from "react";

export default function Playground({
  searchParams,
  params,
}: {
  searchParams: any;
  params: { id: string };
}) {
  const { user, authenticated } = usePrivy();
  const [streamInfo, setStreamInfo] = useState<any>(null);
  const [pipelineData, setPipelineData] = useState<any>(null);

  const getPipelineData = async () => {
    const pipeline = await getPipeline(params.id);
    setPipelineData(pipeline);
  };

  useEffect(() => {
    getPipelineData();
  }, [params.id]);

  useEffect(() => {
    if (pipelineData) {
      track(
        "pipeline_viewed",
        {
          pipeline_id: params.id,
          pipeline_name: pipelineData?.name,
          pipeline_type: pipelineData?.type,
          is_authenticated: authenticated,
          referrer: document.referrer,
        },
        user || undefined,
      );
    }
  }, [pipelineData]);

  return (
    <div className="flex flex-col h-[calc(100%-1rem)]  border border-border  p-4">
      {pipelineData && (
        <ScrollArea className="h-full">
          <div className="flex-shrink-0 flex flex-row justify-between  w-full items-center  md:w-[34%] h-10">
            <h3 className="text-lg font-medium">{pipelineData?.name}</h3>
          </div>
          <div className="flex-grow flex flex-col md:flex-row gap-14 h-full ">
            <div className="w-full md:w-[35%] flex-shrink-0 overflow-hidden flex flex-col ">
              <Form setStreamInfo={setStreamInfo} pipeline={pipelineData} />
            </div>
            <div className="flex-grow overflow-hidden ">
              <Output pipeline={pipelineData} streamInfo={streamInfo} />
            </div>
          </div>
        </ScrollArea>
      )}
      <Modals searchParams={searchParams} />
    </div>
  );
}
