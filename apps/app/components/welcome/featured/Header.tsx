"use client";

import { TrackedButton } from "@/components/analytics/TrackedButton";
import { ClipButton } from "@/components/ClipButton";
import useFullscreenStore from "@/hooks/useFullscreenStore";
import useMobileStore from "@/hooks/useMobileStore";
import { usePromptStore } from "@/hooks/usePromptStore";
import { useStreamStatus } from "@/hooks/useStreamStatus";
import track from "@/lib/track";
import { Button } from "@repo/design-system/components/ui/button";
import { Dialog } from "@repo/design-system/components/ui/dialog";
import { Separator } from "@repo/design-system/components/ui/separator";
import { SidebarTrigger } from "@repo/design-system/components/ui/sidebar";
import { cn } from "@repo/design-system/lib/utils";
import { ChevronLeft, Search, Share, Share2, Users2 } from "lucide-react";
import { Inter } from "next/font/google";
import Link from "next/link";
import { useDreamshaperStore } from "../../../hooks/useDreamshaper";
import { ShareModalContent, useShareModal } from "./ShareModal";
import { usePrivy } from "@/hooks/usePrivy";

const inter = Inter({ subsets: ["latin"] });

export const Header = () => {
  const { authenticated } = usePrivy();
  const { isFullscreen } = useFullscreenStore();
  const { isMobile, isMinHeightScreen } = useMobileStore();
  const { stream, streamUrl } = useDreamshaperStore();
  const { live } = useStreamStatus(stream?.id);
  const { hasSubmittedPrompt } = usePromptStore();
  const { open, setOpen, openModal } = useShareModal();

  return (
    <>
      {!isMobile && (
        <div className="fixed top-4 right-4 z-50">
          <Link target="_blank" href="https://discord.com/invite/hxyNHeSzCK">
            <TrackedButton
              trackingEvent="daydream_join_community_clicked"
              trackingProperties={{
                is_authenticated: authenticated,
                location: "welcome_header",
              }}
              variant="outline"
              className="alwaysAnimatedButton"
              size="sm"
            >
              Join Community
            </TrackedButton>
          </Link>
        </div>
      )}

      <div
        className={cn(
          "flex items-start w-full max-w-[calc(min(100%,calc((100vh-16rem)*16/9)))] mx-auto relative",
          isFullscreen && "hidden",
          isMobile ? "justify-center px-3 py-3" : "justify-between py-3 mt-20",
          isMinHeightScreen && "flex-col gap-6",
          "md:min-w-[596px]",
        )}
      >
        {!isMobile && !isFullscreen && (
          <>
            <div className="absolute bottom-3 left-0 flex items-center">
              <Link
                href="/"
                className="flex items-center text-xs text-foreground hover:underline h-8"
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Back to explore
              </Link>
            </div>

            <div
              className={cn(
                "absolute bottom-3 right-0 flex gap-2 items-center",
                isMinHeightScreen && "relative",
              )}
            >
              <div className="flex items-center gap-2">
                {live && stream?.output_playback_id && streamUrl && (
                  <ClipButton
                    disabled={!stream?.output_playback_id || !streamUrl}
                    className="mr-2"
                    trackAnalytics={track}
                    isAuthenticated={authenticated}
                  />
                )}
                <TrackedButton
                  trackingEvent="daydream_share_button_clicked"
                  trackingProperties={{
                    is_authenticated: authenticated,
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2"
                  onClick={openModal}
                >
                  <Share className="h-4 w-4" />
                  <span>Share</span>
                </TrackedButton>
              </div>
            </div>
          </>
        )}
      </div>

      {isMobile && (
        <div className="z-50 flex justify-between w-full px-4 mt-2">
          <div className="flex items-center">
            <SidebarTrigger />
          </div>

          <div className="flex gap-2 justify-end max-w-[60%]">
            {live && stream?.output_playback_id && streamUrl && (
              <ClipButton
                disabled={!stream?.output_playback_id || !streamUrl}
                trackAnalytics={track}
                isAuthenticated={authenticated}
                isMobile={true}
              />
            )}

            {hasSubmittedPrompt && (
              <Button
                variant="ghost"
                size="icon"
                className="p-0 m-0 bg-transparent border-none hover:bg-transparent focus:outline-none"
                onClick={openModal}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}

            <Link target="_blank" href="https://discord.com/invite/hxyNHeSzCK">
              <Button
                variant="ghost"
                size="icon"
                className="p-0 m-0 bg-transparent border-none hover:bg-transparent focus:outline-none"
              >
                <Users2 className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="p-0 m-0 bg-transparent border-none hover:bg-transparent focus:outline-none"
              >
                <Search className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <ShareModalContent />
      </Dialog>
    </>
  );
};
