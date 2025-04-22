"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { VideoProvider } from "@/app/(main)/VideoProvider";
import { VideoPlayer } from "@/app/(main)/VideoPlayer";
import { GradientAvatar } from "@/components/GradientAvatar";
import { cn } from "@repo/design-system/lib/utils";
import Link from "next/link";

interface OverlayClipViewerProps {
  clip: {
    id: string;
    url: string;
    prompt?: string;
    title?: string;
    authorName?: string;
    createdAt: string;
  };
  onTryPrompt: (prompt: string) => void;
}

export const OverlayClipViewer = ({
  clip,
  onTryPrompt,
}: OverlayClipViewerProps) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="h-screen w-[70vh] border-none bg-transparent shadow-none pt-6 pb-4 backdrop-filter backdrop-blur-[3px] flex justify-center items-center">
      <div className="max-h-[90vh] max-w-[90vh] w-full aspect-video">
        <div className="space-y-12">
          <div className="relative w-full flex justify-between items-center py-2 pl-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center">
                <GradientAvatar
                  seed={clip.authorName || "Anonymous"}
                  size={24}
                  className="h-6 w-6"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-[#09090B]">
                  {clip.authorName || "Livepeer"}
                </span>
                <div className="text-[10px] text-[#707070]">
                  {formatter
                    .format(new Date(clip.createdAt))
                    .replace(" at ", ", ")}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => clip.prompt && onTryPrompt(clip.prompt)}
              disabled={!clip.prompt}
              className={cn("alwaysAnimatedButton text-xs py-2 px-8 h-auto")}
            >
              Try this prompt
            </Button>
          </div>
        </div>

        <div className="w-full h-fit relative mt-2">
          <VideoProvider src={clip.url}>
            <div className="relative w-full">
              <VideoPlayer />
            </div>
          </VideoProvider>
        </div>

        <div className="mt-10">
          <div className="w-[70%] mx-auto">
            <p className="text-xs font-normal text-[#707070] text-center line-clamp-2">
              {clip.prompt || "No prompt available"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
