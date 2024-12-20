"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { Copy, Info, PauseIcon, PlayIcon, Share } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { pipelines } from "../welcome/featured/index";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@repo/design-system/components/ui/alert-dialog";
import { Livepeer } from "livepeer";
import { getSrc } from "@livepeer/react/external";
import * as Player from "@livepeer/react/player";
import { LPPLayer } from "./player";
import track from "@/lib/track";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import Link from "next/link";

export default function Output({
  pipeline,
  streamInfo,
}: {
  streamInfo: any;
  pipeline: any;
}) {
  const [showModelInfo, setShowModelInfo] = useState(false);

  const modelInfo = [
    {
      title: "Model Type",
      value: "Lightning",
    },
    {
      title: "Model Size",
      value: "1.3GB",
    },
    {
      title: "Model Speed",
      value: "10 FPS",
    },
    {
      title: "Model Cost",
      value: "$0.00",
    },
    {
      title: "Model License",
      value: "Commercial",
    },
  ];

  const copyLogs = () => {
    navigator.clipboard.writeText(JSON.stringify(streamInfo));
    toast.success("Logs copied to clipboard");
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-shrink-0 flex justify-end mb-4 space-x-4">
        <div className="text-muted-foreground">
              Your stream may take up to 90 seconds to start.
        </div>
        {streamInfo?.output_stream_url && (
          <Button variant="outline" onClick={() => copyLogs()}>
            <Copy className="mr-2" /> Copy logs
          </Button>
        )}
        {/* TODO: COMMENTED OUT UNTIL WE HAVE TIME TO IMPLEMENT FETCHING PIPELINE DETAILS FROM THE DB
         <Button
          variant="outline"
          onClick={() => setShowModelInfo(!showModelInfo)}
        >
          <Info className="mr-2" /> Pipeline Details
        </Button> */}
        <Button variant="outline" asChild>
          <Link href={"/stream/create?pipeline=" + pipeline.id}>
            <ArrowTopRightIcon className="mr-2" /> Create Stream
          </Link>
        </Button>
      </div>
      <div className="bg-sidebar rounded-2xl relative h-[calc(100vh-16rem)] w-full">
        {streamInfo?.output_playback_id && (
            <div className="w-full h-full relative overflow-hidden z-10">
              <LPPLayer output_playback_id={streamInfo?.output_playback_id} />
            </div>
        )}
      </div>

      <AlertDialog open={showModelInfo} onOpenChange={setShowModelInfo}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-medium">
              {pipeline?.name}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pipeline?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-sm">
            {modelInfo.map((info) => (
              <div key={info.title} className="font-medium mt-1.5">
                {info.title}:{" "}
                <span className="text-muted-foreground">{info.value}</span>{" "}
              </div>
            ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
