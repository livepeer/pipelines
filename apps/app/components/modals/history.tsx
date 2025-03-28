"use client";

import React, { useEffect } from "react";
import { XIcon } from "lucide-react";
import { Label } from "@repo/design-system/components/ui/label";
import LoggedOutComponent from "./logged-out";
import { PipelineCard } from "./liked-pipeline";
import { usePrivy } from "@/hooks/usePrivy";
import { useRouter, useSearchParams } from "next/navigation";
import track from "@/lib/track";

const MOCK_HISTORY_DATA = [
  {
    title: "Text to Image",
    description: "Lorem ipsum dolor sit amet",
    createdAt: new Date(),
    date: "Today",
    pipeline: "image",
  },
  {
    title: "Text to Video",
    description: "Lorem ipsum dolor sit amet",
    createdAt: new Date(),
    date: "Yesterday",
    pipeline: "video",
  },
  {
    title: "Audio to Text",
    description: "Lorem ipsum dolor sit amet",
    createdAt: new Date(),
    date: "Yesterday",
    pipeline: "audio",
  },
  {
    title: "Object Detection",
    description: "Lorem ipsum dolor sit amet",
    createdAt: new Date(),
    date: "Yesterday",
    pipeline: "image",
  },
  {
    title: "Image Upscaling",
    description: "Lorem ipsum dolor sit amet",
    createdAt: new Date(),
    date: "Previous 7 Days",
    pipeline: "audio",
  },
  {
    title: "Text to Image",
    description: "Lorem ipsum dolor sit amet",
    createdAt: new Date(),
    date: "Previous 7 Days",
    pipeline: "image",
  },
  {
    title: "Text to Video",
    description: "Lorem ipsum dolor sit amet",
    createdAt: new Date(),
    date: "Previous 7 Days",
    pipeline: "video",
  },
  {
    title: "Image to Image",
    description: "Lorem ipsum dolor sit amet",
    createdAt: new Date(),
    date: "Previous 7 Days",
    pipeline: "audio",
  },
  {
    title: "Image to Video",
    description: "Lorem ipsum dolor sit amet",
    createdAt: new Date(),
    date: "Previous 7 Days",
    pipeline: "video",
  },
] as const;

// If not already defined in a shared types file
interface Pipeline {
  title: string;
  description: string;
  createdAt: Date;
  date: string;
  pipeline: "image" | "video" | "audio";
}

const groupPipelinesByDate = (pipelines: Pipeline[]) => {
  return pipelines.reduce(
    (acc, pipeline) => {
      if (!acc[pipeline.date]) {
        acc[pipeline.date] = [];
      }
      acc[pipeline.date].push(pipeline);
      return acc;
    },
    {} as Record<string, Pipeline[]>,
  );
};

const Header = ({ onClick }: { onClick: () => void }) => (
  <div className="flex items-center justify-between">
    <div>
      <h4 className="text-lg font-medium">History</h4>
      <p className="text-sm text-muted-foreground">
        View all the pipelines you have viewed
      </p>
    </div>
    <XIcon
      onClick={onClick}
      className="w-5 h-5 cursor-pointer"
      style={{ strokeWidth: 1.5 }}
    />
  </div>
);

interface PipelineListProps {
  groupedPipelines: Record<string, Pipeline[]>;
}

const PipelineList = ({ groupedPipelines }: PipelineListProps) => (
  <div className="flex flex-col gap-3 mt-4">
    {Object.entries(groupedPipelines).map(([date, pipelines]) => (
      <React.Fragment key={date}>
        <Label className="text-sm text-muted-foreground mt-2">{date}:</Label>
        {pipelines.map(pipeline => (
          <PipelineCard key={pipeline.title} pipeline={pipeline} />
        ))}
      </React.Fragment>
    ))}
  </div>
);

export const HistoryPipelines = ({ open }: { open: boolean }) => {
  const { user } = usePrivy();
  if (!open) return null;

  const { authenticated } = usePrivy();
  const router = useRouter();
  const searchParams = useSearchParams();

  const closeModal = () => {
    const { tab, ...params } = Object.fromEntries(searchParams.entries());
    const newParams = new URLSearchParams(params).toString();
    router.replace(`${window.location.pathname}?${newParams}`);
  };

  if (!authenticated) {
    return (
      <div className="p-4">
        <Header onClick={closeModal} />
        <LoggedOutComponent text="Sign in to view your history" />
      </div>
    );
  }

  // @ts-expect-error - TODO: Fix this
  const groupedPipelines = groupPipelinesByDate(MOCK_HISTORY_DATA);

  useEffect(() => {
    track("history_pipelines_modal_opened", undefined, user || undefined);
  }, [user]);

  return (
    <div className="p-4">
      <Header onClick={closeModal} />
      <PipelineList groupedPipelines={groupedPipelines} />
    </div>
  );
};

export default HistoryPipelines;
