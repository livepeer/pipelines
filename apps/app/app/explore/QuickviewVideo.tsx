"use client";

import { usePreviewStore } from "@/hooks/usePreviewStore";
import { handleSessionId } from "@/lib/analytics/mixpanel";
import { getAccessToken } from "@privy-io/react-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@repo/design-system/components/ui/dialog";
import { ChevronLeft, Repeat, User2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { VideoPlayer } from "./VideoPlayer";
import { VideoProvider } from "./VideoProvider";

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
  title: string;
  createdAt: string;
  authorName: string;
  remixCount: number;
}

export default function QuickviewVideo({
  children,
  clipId,
  src,
  title,
  authorName,
  createdAt,
  remixCount,
}: QuickviewVideoProps) {
  const { setIsPreviewOpen, isPreviewOpen } = usePreviewStore();
  const router = useRouter();

  useEffect(() => {
    setIsPreviewOpen(true);

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

    return () => {
      setIsPreviewOpen(false);
    };
  }, []);

  return (
    <Dialog open={isPreviewOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="max-h-[90vh] max-w-[70vh] border-none bg-transparent shadow-none pt-6 pb-4 backdrop-filter backdrop-blur-[3px]"
        overlayClassName="bg-white sm:bg-[rgba(255,255,255,0.90)]"
        displayCloseButton={false}
        onInteractOutside={e => {
          setIsPreviewOpen(false);
          router.push("/explore", { scroll: false });
        }}
      >
        <DialogHeader className="space-y-4">
          <div className="relative w-full">
            <button
              className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-medium text-[#09090B] outline-none hover:bg-zinc-100 px-2 py-1 rounded"
              onClick={() => {
                setIsPreviewOpen(false);
                router.push("/explore", { scroll: false });
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:block">Back</span>
            </button>

            <div className="flex flex-col items-center gap-1 py-2 px-4">
              <h2 className="text-2xl font-bold text-[#232323]">{title}</h2>
              <div className="text-sm text-[#707070]">
                {formatter.format(new Date(createdAt)).replace(" at ", ", ")}
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-between items-center p-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center">
                <User2 className="w-4 h-4 text-[#09090B]" />
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

        <div className="w-full h-fit relative">
          <VideoProvider src={src}>
            <div className="relative w-full">
              <VideoPlayer />
            </div>
          </VideoProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
