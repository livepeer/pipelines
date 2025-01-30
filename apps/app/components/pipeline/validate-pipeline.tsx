"use client";
import { LoaderCircleIcon } from "lucide-react";
import PipelineStatus from "./status";
import { useState } from "react";

export default function ValidatePipeline({ streamId }: { streamId: string }) {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <div className="p-4">
      <div className="flex items-center gap-4">
        <h3 className="font-medium text-lg">
          Pre-Deployment Pipeline Validation
        </h3>

        {isLoading && <LoaderCircleIcon className="w-4 h-4 animate-spin" />}
      </div>

      <PipelineStatus streamId={streamId} setIsLoading={setIsLoading} />
    </div>
  );
}
