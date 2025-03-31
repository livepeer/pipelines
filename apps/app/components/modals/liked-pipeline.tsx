"use client";

import React, { useEffect } from "react";
import { XIcon } from "lucide-react";
import { Label } from "@repo/design-system/components/ui/label";
import LoggedOutComponent from "./logged-out";
import { useRouter, useSearchParams } from "next/navigation";
import track from "@/lib/track";
import { usePrivy } from "@privy-io/react-auth";

const PIPELINE_ICONS = {
  image: {
    color: "#F9197F",
    path: "M0 4C0 1.79086 1.79086 0 4 0H16C18.2091 0 20 1.79086 20 4V10.449L17.7535 8.97857C16.019 7.84327 13.7486 7.96391 12.1442 9.2766L6.906 13.5624C5.80825 14.4606 4.25482 14.5431 3.06808 13.7663L0 11.7581V4ZM16.932 10.2336L20 12.2418V16C20 18.2091 18.2091 20 16 20H4C1.79086 20 0 18.2091 0 16V13.5509L2.24659 15.0214C3.98106 16.1567 6.25145 16.036 7.85585 14.7233L13.0941 10.4375C14.1918 9.53938 15.7452 9.45684 16.932 10.2336ZM6.5 9C7.88071 9 9 7.88071 9 6.5C9 5.11929 7.88071 4 6.5 4C5.11929 4 4 5.11929 4 6.5C4 7.88071 5.11929 9 6.5 9Z",
    viewBox: "0 0 20 20",
  },
  video: {
    color: "#00BA7C",
    path: "M0 4C0 1.79086 1.79086 0 4 0H10C12.2091 0 14 1.79086 14 4V12C14 14.2091 12.2091 16 10 16H4C1.79086 16 0 14.2091 0 12V4ZM4.25 8C4.25 7.58579 4.58579 7.25 5 7.25H9C9.41421 7.25 9.75 7.58579 9.75 8C9.75 8.41421 9.41421 8.75 9 8.75H5C4.58579 8.75 4.25 8.41421 4.25 8ZM16.5409 12.3103L15.5 11.1999V4.79993L16.5409 3.68961C17.781 2.3669 20 3.24442 20 5.05749V10.9424C20 12.7554 17.781 13.633 16.5409 12.3103Z",
    viewBox: "0 0 20 16",
  },
  audio: {
    color: "#FFD400",
    path: "M10 1.75C5.44365 1.75 1.75 5.44365 1.75 10V10.9997C2.37675 10.529 3.1558 10.25 4 10.25C6.07107 10.25 7.75 11.9289 7.75 14V16C7.75 18.0711 6.07107 19.75 4 19.75C1.92893 19.75 0.25 18.0711 0.25 16V14.75V14V10C0.25 4.61522 4.61522 0.25 10 0.25C15.3848 0.25 19.75 4.61522 19.75 10V14V14.75V16C19.75 18.0711 18.0711 19.75 16 19.75C13.9289 19.75 12.25 18.0711 12.25 16V14C12.25 11.9289 13.9289 10.25 16 10.25C16.8442 10.25 17.6233 10.529 18.25 10.9997V10C18.25 5.44365 14.5563 1.75 10 1.75Z",
    viewBox: "0 0 20 20",
  },
};

const MOCK_DATA = [
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
] as const;

type PipelineType = (typeof MOCK_DATA)[number]["pipeline"];

interface Pipeline {
  title: string;
  description: string;
  createdAt: Date;
  date: string;
  pipeline: PipelineType;
}

const PipelineIcon = ({ type }: { type: PipelineType }) => {
  const icon = PIPELINE_ICONS[type];

  return (
    <div className="border border-border/50 rounded-lg p-2 mr-2">
      <svg
        width="19"
        height="19"
        viewBox={icon.viewBox}
        className="w-4 h-4"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d={icon.path}
          fill={icon.color}
        />
      </svg>
    </div>
  );
};

export const PipelineCard = ({ pipeline }: { pipeline: Pipeline }) => {
  return (
    <div className="flex items-center gap-2 justify-between">
      <div className="flex flex-row items-center gap-1">
        <PipelineIcon type={pipeline.pipeline} />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">{pipeline.title}</p>
          <p className="text-sm text-muted-foreground -mt-1">
            {pipeline.description}
          </p>
        </div>
      </div>
    </div>
  );
};

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

export const LikedPipelines = ({ open }: { open: boolean }) => {
  if (!open) return null;

  // @ts-expect-error - TODO: Fix this
  const groupedPipelines = groupPipelinesByDate(MOCK_DATA);
  const { authenticated, user } = usePrivy();
  const router = useRouter();
  console.log("liked pipelines user", user);
  const searchParams = useSearchParams();

  const closeModal = () => {
    const { tab, ...params } = Object.fromEntries(searchParams.entries());
    const newParams = new URLSearchParams(params).toString();
    router.replace(`${window.location.pathname}?${newParams}`);
  };

  useEffect(() => {
    track("liked_pipelines_modal_opened", undefined, user || undefined);
  }, [user]);

  if (!authenticated) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-medium">Liked pipelines</h4>
            <p className="text-sm text-muted-foreground">
              View all the pipelines you liked
            </p>
          </div>
          <XIcon
            onClick={closeModal}
            className="w-5 h-5 cursor-pointer"
            style={{ strokeWidth: 1.5 }}
          />
        </div>
        <LoggedOutComponent text="Sign in to view your liked pipelines" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-medium">Liked pipelines</h4>
          <p className="text-sm text-muted-foreground">
            View all the pipelines you liked
          </p>
        </div>
        <XIcon
          className="w-5 h-5 cursor-pointer"
          style={{ strokeWidth: 1.5 }}
          onClick={closeModal}
        />
      </div>

      <div className="flex flex-col gap-3 mt-4">
        {Object.entries(groupedPipelines).map(([date, pipelines]) => (
          <React.Fragment key={date}>
            <Label className="text-sm text-muted-foreground mt-2">
              {date}:
            </Label>
            {pipelines.map(pipeline => (
              <PipelineCard key={pipeline.title} pipeline={pipeline} />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default LikedPipelines;
