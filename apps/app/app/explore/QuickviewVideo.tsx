"use client";

import { GradientAvatar } from "@/components/GradientAvatar";
import { usePreviewStore } from "@/hooks/usePreviewStore";
import { handleSessionId } from "@/lib/analytics/mixpanel";
import { getAccessToken } from "@privy-io/react-auth";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@repo/design-system/components/ui/dialog";
import { cn } from "@repo/design-system/lib/utils";
import { Repeat, WandSparkles, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { VideoPlayer } from "./VideoPlayer";
import { VideoProvider } from "./VideoProvider";
import { Button } from "@repo/design-system/components/ui/button";

const formatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

interface QuickviewVideoProps {
  children: React.ReactNode;
  clipId: string;
  src: string;
  prompt?: string;
  title: string;
  createdAt: string;
  authorName: string;
  remixCount: number;
}

export default function QuickviewVideo({
  children,
  clipId,
  src,
  prompt,
  title,
  authorName,
  createdAt,
  remixCount,
}: QuickviewVideoProps) {
  const { setIsPreviewOpen, isPreviewOpen } = usePreviewStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const log = async () => {
      const accessToken = await getAccessToken();
      await fetch(`/api/clips/${clipId}/views`, {
        method: "POST",
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId: handleSessionId() }),
      });
    };

    log();
  }, []);

  useEffect(() => {
    if (pathname !== "/explore") setIsPreviewOpen(true);
    else setIsPreviewOpen(false);
  }, [pathname]);

  const handleClose = () => {
    setIsPreviewOpen(false);
    router.push("/explore", { scroll: false });
  };

  return (
    <>
      <Dialog open={isPreviewOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent
          className="h-screen max-w-screen border-none bg-transparent shadow-none pt-12 pb-4 backdrop-filter backdrop-blur-[3px] flex justify-center items-center"
          overlayClassName="bg-white sm:bg-[rgba(255,255,255,0.90)]"
          displayCloseButton={false}
          onClick={handleClose}
          onOpenAutoFocus={e => {
            e.preventDefault();
          }}
          key={clipId}
        >
          <div className="absolute top-4 right-8 z-[999] cursor-pointer">
            <Button
              className={cn(
                "flex items-center py-2 px-4 gap-2 font-medium cursor-pointer rounded-xl",
              )}
              onClick={e => e.stopPropagation()}
            >
              <WandSparkles className="size-1" />

              <span className="text-sm">Remix</span>
            </Button>
          </div>
          <div
            className="max-h-[90vh] max-w-2xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <DialogHeader className="space-y-12">
              <div className="relative w-full">
                <button
                  className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-medium text-[#09090B] outline-none hover:bg-zinc-100 p-2 rounded"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    router.push("/explore", { scroll: false });
                  }}
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute right-1/2 translate-x-1/2 top-1/2 -translate-y-1/2">
                  <div className="flex flex-col items-center gap-1 px-4">
                    <div className="text-sm text-[#707070]">
                      {formatter
                        .format(new Date(createdAt))
                        .replace(" at ", ", ")}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-row justify-between items-center p-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center">
                    <GradientAvatar
                      seed={authorName}
                      size={24}
                      className="h-6 w-6"
                    />
                  </div>
                  <span className="text-xs font-medium text-[#09090B]">
                    {authorName}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Repeat className="w-4 h-4 text-[#09090B]" />
                  <span className="text-sm text-[#09090B]">{remixCount}</span>
                </div>
              </div>
            </DialogHeader>

            <div className="w-full h-fit relative mt-4">
              <VideoProvider src={src}>
                <div className="relative w-full">
                  <VideoPlayer />
                </div>
              </VideoProvider>
            </div>

            <DialogFooter className="mt-6">
              <div className="w-full mt-6 px-4">
                <p className="text-xs font-normal text-[#707070] italic text-center">
                  {prompt || "No prompt available"}
                </p>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
