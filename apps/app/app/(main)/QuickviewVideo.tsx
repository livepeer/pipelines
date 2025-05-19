"use client";

import { TrackedButton } from "@/components/analytics/TrackedButton";
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
import { X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { VideoPlayer } from "./VideoPlayer";
import { VideoProvider } from "./VideoProvider";
import { useCapacityCheck } from "@/hooks/useCapacityCheck";
import { CapacityNotificationModal } from "@/components/modals/capacity-notification-modal";
import track from "@/lib/track";
import { toast } from "sonner";

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
  authorDetails?: Record<string, any>;
  isTutorial?: boolean;
}

export default function QuickviewVideo({
  children,
  clipId,
  src,
  prompt,
  title,
  authorName,
  authorDetails,
  createdAt,
  isTutorial,
}: QuickviewVideoProps) {
  const { setIsPreviewOpen, isPreviewOpen } = usePreviewStore();
  const router = useRouter();
  const pathname = usePathname();
  const { hasCapacity } = useCapacityCheck();
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);

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
    if (pathname !== "/") {
      setIsPreviewOpen(true);
    } else {
      setIsPreviewOpen(false);
    }
  }, [pathname]);

  // On unmount, set the preview to false to reset back /explore elements
  useEffect(() => {
    return () => {
      setIsPreviewOpen(false);
    };
  }, []);

  const handleClose = () => {
    setIsPreviewOpen(false);
    router.push("/", { scroll: false });
  };

  const handleTryPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!hasCapacity) {
      track("capacity_try_prompt_blocked", { location: "quickview_video" });
      setIsCapacityModalOpen(true);
      return;
    }

    router.push(
      prompt
        ? `/create?inputPrompt=${btoa(prompt)}&sourceClipId=${btoa(clipId)}`
        : "/create",
    );
  };

  return (
    <>
      <Dialog open={isPreviewOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent
          className="h-screen max-w-screen border-none bg-transparent shadow-none pt-12 pb-4 backdrop-filter backdrop-blur-[3px] flex justify-center items-center z-[9999]"
          overlayClassName="bg-white sm:bg-[rgba(255,255,255,0.90)] z-[9999]"
          displayCloseButton={false}
          onClick={handleClose}
          onOpenAutoFocus={e => {
            e.preventDefault();
          }}
          key={clipId}
        >
          <button
            className="absolute top-4 right-4 z-[999] flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-[#09090B] outline-none hover:bg-zinc-200 transition-colors"
            onClick={e => {
              e.stopPropagation();
              handleClose();
            }}
          >
            <X className="w-4 h-4" />
          </button>
          <div
            className="max-h-[90vh] w-full aspect-video max-w-[73vh]"
            onClick={e => e.stopPropagation()}
          >
            <DialogHeader className="space-y-12">
              <div className="relative w-full flex justify-between items-center py-2 pl-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center">
                    <GradientAvatar
                      seed={authorDetails?.avatar ?? authorName}
                      size={24}
                      className="h-6 w-6"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-[#09090B]">
                      {authorName}
                    </span>
                    <div className="text-[10px] text-[#707070]">
                      {formatter
                        .format(new Date(createdAt))
                        .replace(" at ", ", ")}
                    </div>
                  </div>
                </div>

                {!isTutorial && (
                  <Link
                    href="#"
                    onClick={handleTryPrompt}
                    className={cn(
                      "alwaysAnimatedButton text-xs py-2 px-8 h-auto",
                    )}
                  >
                    Try this prompt
                  </Link>
                )}
              </div>
            </DialogHeader>

            <div className="w-full h-fit relative mt-2">
              <VideoProvider src={src}>
                <div className="relative w-full">
                  <VideoPlayer />
                </div>
              </VideoProvider>
            </div>

            <DialogFooter
              className="mt-6 hover:cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(prompt || "");
                toast.success("Prompt copied to clipboard");
              }}
            >
              <div className="w-[70%] mt-6 mx-auto">
                <p className="text-xs font-normal text-[#707070] text-center line-clamp-2">
                  {prompt || "No prompt available"}
                </p>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <CapacityNotificationModal
        isOpen={isCapacityModalOpen}
        onClose={() => setIsCapacityModalOpen(false)}
      />
    </>
  );
}
