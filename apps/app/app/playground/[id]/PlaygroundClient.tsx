"use client";

import Modals from "@/components/modals";
import Form from "@/components/playground/form";
import Output from "@/components/playground/output";
import { usePrivy } from "@/hooks/usePrivy";
import track from "@/lib/track";
import { ScrollArea } from "@repo/design-system/components/ui/scroll-area";
import { useEffect, useState } from "react";

interface PlaygroundClientProps {
  pipelineData: any;
  pipelineId: string;
  searchParams: any;
}

export default function PlaygroundClient({
  pipelineData,
  pipelineId,
  searchParams,
}: PlaygroundClientProps) {
  const { user, authenticated } = usePrivy();
  const [streamInfo, setStreamInfo] = useState<any>(null);

  useEffect(() => {
    if (pipelineData) {
      track(
        "pipeline_viewed",
        {
          pipeline_id: pipelineId,
          pipeline_name: pipelineData?.name,
          pipeline_type: pipelineData?.type,
          is_authenticated: authenticated,
          referrer: document.referrer,
        },
        user || undefined,
      );
    }
  }, [pipelineData, pipelineId, authenticated, user]);

  return (
    <ScrollArea className="h-full">
      <div className="flex-shrink-0 flex flex-row justify-between w-full items-center md:w-[34%] h-10">
        <h3 className="text-lg font-medium">{pipelineData?.name}</h3>
      </div>
      <div className="flex-grow flex flex-col md:flex-row gap-14 h-full">
        <div className="w-full md:w-[35%] flex-shrink-0 overflow-hidden flex flex-col">
          <Form setStreamInfo={setStreamInfo} pipeline={pipelineData} />
        </div>
        <div className="flex-grow overflow-hidden">
          <Output pipeline={pipelineData} streamInfo={streamInfo} />
        </div>
      </div>
      <Modals searchParams={searchParams} />
    </ScrollArea>
  );
}
