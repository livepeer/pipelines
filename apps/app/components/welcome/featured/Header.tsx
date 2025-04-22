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
import {
  ChevronLeft,
  Scissors,
  Search,
  Share,
  Share2,
  Users2,
} from "lucide-react";
import { Inter } from "next/font/google";
import Link from "next/link";
import { useDreamshaperStore } from "../../../hooks/useDreamshaper";
import { ShareModalContent, useShareModal } from "./ShareModal";
import { usePrivy } from "@/hooks/usePrivy";
import { useState } from "react";
import { GuestSignupModal } from "@/components/guest/GuestSignupModal";
import { useGuestUserStore } from "@/hooks/useGuestUser";

const inter = Inter({ subsets: ["latin"] });

interface HeaderProps {
  isGuestMode?: boolean;
  onShareAttempt?: () => boolean;
}

export const Header = ({
  isGuestMode = false,
  onShareAttempt,
}: HeaderProps) => {
  const { authenticated } = usePrivy();
  const { isFullscreen } = useFullscreenStore();
  const { isMobile, isMinHeightScreen } = useMobileStore();
  const { stream, streamUrl } = useDreamshaperStore();
  const { live } = useStreamStatus(stream?.id);
  const { hasSubmittedPrompt } = usePromptStore();
  const { open, setOpen, openModal } = useShareModal();
  const { setHasRecordedClip, lastPrompt } = useGuestUserStore();

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestModalReason, setGuestModalReason] = useState<
    "prompt_limit" | "record_clip" | "share" | null
  >(null);

  const handleShare = () => {
    if (isGuestMode && onShareAttempt) {
      const shouldBlock = onShareAttempt();
      if (shouldBlock) {
        return;
      }
    }

    openModal();
  };

  const handleGuestRecordClip = () => {
    if (isGuestMode) {
      setHasRecordedClip(true);
      setGuestModalReason("record_clip");
      setShowGuestModal(true);
      track("guest_record_attempt", {
        last_prompt: lastPrompt,
      });
      return true;
    }
    return false;
  };

  return (
    <>
      {!isMobile && (
        <div className="fixed top-4 right-4 z-50">
          <Link target="_blank" href="https://discord.com/invite/hxyNHeSzCK">
            <TrackedButton
              trackingEvent="daydream_join_community_clicked"
              trackingProperties={{
                is_authenticated: authenticated,
                is_guest_mode: isGuestMode,
                location: "welcome_header",
              }}
              variant="outline"
              className="alwaysAnimatedButton rounded-md"
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
              <TrackedButton
                trackingEvent="daydream_back_to_explore_clicked"
                trackingProperties={{
                  is_authenticated: authenticated,
                  is_guest_mode: isGuestMode,
                }}
                variant="ghost"
                size="sm"
                className="h-8 gap-2 rounded-md"
                asChild
              >
                <Link href="/">
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back to explore</span>
                </Link>
              </TrackedButton>
            </div>

            <div
              className={cn(
                "absolute bottom-3 right-0 flex gap-2 items-center",
                isMinHeightScreen && "relative",
              )}
            >
              <div className="flex items-center gap-2">
                {isGuestMode ? (
                  <TrackedButton
                    trackingEvent="daydream_clip_button_clicked"
                    trackingProperties={{
                      is_authenticated: false,
                      is_guest_mode: true,
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 relative overflow-hidden mr-2 rounded-md"
                    onClick={() => handleGuestRecordClip()}
                  >
                    <div className="z-20 relative flex items-center gap-2">
                      <Scissors size={16} />
                      <span>Create Clip</span>
                    </div>
                  </TrackedButton>
                ) : (
                  live &&
                  stream?.output_playback_id &&
                  streamUrl && (
                    <ClipButton
                      disabled={!stream?.output_playback_id || !streamUrl}
                      className="mr-2 rounded-md"
                      trackAnalytics={track}
                      isAuthenticated={authenticated}
                    />
                  )
                )}
                <TrackedButton
                  trackingEvent="daydream_share_button_clicked"
                  trackingProperties={{
                    is_authenticated: authenticated,
                    is_guest_mode: isGuestMode,
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 rounded-md"
                  onClick={handleShare}
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
            {isGuestMode ? (
              <Button
                variant="ghost"
                size="icon"
                className="p-0 m-0 bg-transparent border-none hover:bg-transparent focus:outline-none rounded-md"
                onClick={() => handleGuestRecordClip()}
              >
                <Scissors className="h-4 w-4" />
              </Button>
            ) : (
              live &&
              stream?.output_playback_id &&
              streamUrl && (
                <ClipButton
                  disabled={!stream?.output_playback_id || !streamUrl}
                  trackAnalytics={track}
                  isAuthenticated={authenticated}
                  isMobile={true}
                  className="rounded-md"
                />
              )
            )}

            {hasSubmittedPrompt && (
              <Button
                variant="ghost"
                size="icon"
                className="p-0 m-0 bg-transparent border-none hover:bg-transparent focus:outline-none rounded-md"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}

            <Link target="_blank" href="https://discord.com/invite/hxyNHeSzCK">
              <Button
                variant="ghost"
                size="icon"
                className="p-0 m-0 bg-transparent border-none hover:bg-transparent focus:outline-none rounded-md"
              >
                <Users2 className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="p-0 m-0 bg-transparent border-none hover:bg-transparent focus:outline-none rounded-md"
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

      {/* Guest user signup modal */}
      <GuestSignupModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        reason={guestModalReason}
      />
    </>
  );
};
