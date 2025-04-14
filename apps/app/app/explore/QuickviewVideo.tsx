import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@repo/design-system/components/ui/dialog";
import { ChevronLeft, Repeat, User2 } from "lucide-react";
import { VideoProvider } from "./VideoProvider";
import { VideoPlayer } from "./VideoPlayer";
import { getAccessToken } from "@privy-io/react-auth";
import { handleSessionId } from "@/lib/analytics/mixpanel";
import { usePreviewStore } from "@/hooks/usePreviewStore";

interface QuickviewVideoProps {
  children: React.ReactNode;
  clipId: string;
  src: string;
}

export default function QuickviewVideo({
  children,
  clipId,
  src,
}: QuickviewVideoProps) {
  const setIsPreviewOpen = usePreviewStore(state => state.setIsPreviewOpen);

  return (
    <Dialog
      onOpenChange={async open => {
        setIsPreviewOpen(open);

        if (!open) return;

        const accessToken = await getAccessToken();
        await fetch(`/api/clips/${clipId}/views`, {
          method: "POST",
          headers: {
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId: handleSessionId() }),
        });
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="max-h-[90vh] max-w-[70vh] border-none bg-transparent shadow-none pt-6 pb-4 backdrop-filter backdrop-blur-[3px]"
        overlayClassName="bg-white sm:bg-[rgba(255,255,255,0.90)]"
        displayCloseButton={false}
      >
        <DialogHeader className="space-y-4">
          <div className="relative w-full">
            <DialogClose asChild>
              <button className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-medium text-[#09090B] outline-none hover:bg-zinc-100 px-2 py-1">
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:block">Back</span>
              </button>
            </DialogClose>

            <div className="flex flex-col items-center gap-1 py-2 px-4">
              <h2 className="text-2xl font-bold text-[#232323]">
                Vincent Van Gogh
              </h2>
              <div className="text-sm text-[#707070]">Mar 31, 8:41 AM</div>
            </div>
          </div>
          <div className="flex flex-row justify-between items-center p-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center">
                <User2 className="w-4 h-4 text-[#09090B]" />
              </div>
              <span className="text-xs font-medium text-[#09090B]">
                Luke Zembrzuski
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Repeat className="w-4 h-4 text-[#09090B]" />
              <span className="text-sm text-[#09090B]">123</span>
            </div>
          </div>
        </DialogHeader>

        <div className="w-full h-fit relative">
          <VideoProvider src={src}>
            <VideoPlayerWrapper />
          </VideoProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VideoPlayerWrapper() {
  return (
    <div className="relative w-full">
      <VideoPlayer />
    </div>
  );
}
