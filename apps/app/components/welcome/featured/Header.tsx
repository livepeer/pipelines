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
import { Share, Share2, Users2 } from "lucide-react";
import { Inter } from "next/font/google";
import Image from "next/image";
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
      <div
        className={cn(
          "flex items-start mt-4 w-full max-w-[calc(min(100%,calc((100vh-16rem)*16/9)))] mx-auto relative",
          isFullscreen && "hidden",
          isMobile ? "justify-center px-3 py-3" : "justify-between py-3",
          isMinHeightScreen && "flex-col gap-6",
          "min-w-[596px]",
        )}
      >
        {isMobile && (
          <div className="absolute flex items-center left-2 top-7">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        )}
        <div
          className={cn(
            "flex flex-col gap-2",
            isMobile ? "text-center items-center" : "text-left items-start",
            "",
          )}
        >
          <div
            className={cn(
              inter.className,
              "text-lg md:text-xl flex flex-col uppercase font-light",
              isMobile ? "items-center" : "items-start",
            )}
          >
            <h1 className="tracking-widest">Daydream</h1>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-xs text-neutral-800 font-medium">BY </span>
              <span className="w-16">
                <Image
                  src="https://mintlify.s3.us-west-1.amazonaws.com/livepeer-ai/logo/light.svg"
                  alt="Livepeer logo"
                  width={100}
                  height={100}
                />
              </span>
            </div>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground max-w-[280px] md:max-w-none">
            Transform your video in real-time with AI
          </p>
        </div>

        {/* Header buttons */}
        {!isMobile && !isFullscreen && (
          <div
            className={cn(
              "absolute bottom-3 right-0 flex gap-2",
              isMinHeightScreen && "relative",
            )}
          >
            <div className="flex items-center gap-2">
              {/* Only show clip button when stream is live */}
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

            <Link
              target="_blank"
              href="https://discord.com/invite/hxyNHeSzCK"
              className="bg-transparent hover:bg-black/10 border border-muted-foreground/30 text-foreground px-3 py-1 text-xs rounded-lg font-semibold h-[36px] flex items-center"
            >
              Join Community
            </Link>
          </div>
        )}
      </div>

      {isMobile && (
        <div className="z-50 flex gap-2 justify-end px-4 mt-2">
          {/* Mobile clip button - only show when live */}
          {live && stream?.output_playback_id && streamUrl && (
            <ClipButton
              disabled={!stream?.output_playback_id || !streamUrl}
              trackAnalytics={track}
              isAuthenticated={authenticated}
              isMobile={true}
            />
          )}

          {/* Mobile share button */}
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
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <ShareModalContent />
      </Dialog>
    </>
  );
};
