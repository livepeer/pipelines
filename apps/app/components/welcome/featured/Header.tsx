"use client";

import { TrackedButton } from "@/components/analytics/TrackedButton";
import { ClipButton } from "@/components/daydream/Clipping/ClipButton";
import { GuestSignupModal } from "@/components/guest/GuestSignupModal";
import useFullscreenStore from "@/hooks/useFullscreenStore";
import { useGuestUserStore } from "@/hooks/useGuestUser";
import useMobileStore from "@/hooks/useMobileStore";
import { useOverlayStore } from "@/hooks/useOverlayStore";
import { usePrivy } from "@/hooks/usePrivy";
import { usePromptStore } from "@/hooks/usePromptStore";
import track from "@/lib/track";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { Button } from "@repo/design-system/components/ui/button";
import { Dialog } from "@repo/design-system/components/ui/dialog";
import { SidebarTrigger } from "@repo/design-system/components/ui/sidebar";
import { cn } from "@repo/design-system/lib/utils";
import { ChevronLeft, Share, Share2 } from "lucide-react";
import { Inter } from "next/font/google";
import Link from "next/link";
import { useState } from "react";
import { useDreamshaperStore } from "../../../hooks/useDreamshaper";
import { usePlayerStore } from "./player";
import { ShareModalContent, useShareModal } from "./ShareModal";

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
  const { isPlaying } = usePlayerStore();
  const { hasSubmittedPrompt } = usePromptStore();
  const { open, setOpen, openModal } = useShareModal();
  const { setHasRecordedClip, lastPrompt } = useGuestUserStore();
  const { setIsOverlayOpen, setOverlayType } = useOverlayStore();

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
      track("guest_record_attempt", {
        last_prompt: lastPrompt,
      });
      return false;
    }
    return false;
  };

  const handleExploreClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // First set type, then open overlay for smoother transition
    // Only set overlayType if it's not already set
    setOverlayType("bento");
    setIsOverlayOpen(true);

    track("daydream_back_to_explore_clicked", {
      is_authenticated: authenticated,
      is_guest_mode: isGuestMode,
      via_overlay: true,
    });
  };

  return (
    <>
      {!isMobile && (
        <div className="fixed top-4 right-4 z-50">
          <Link target="_blank" href="https://discord.gg/5sZu8xmn6U">
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
              <DiscordLogoIcon className="h-4 w-4" /> Join Discord
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
        {/* Desktop Beta Badge */}
        {!isMobile && !isFullscreen && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full flex justify-center">
            <a
              href="https://livepeer.notion.site/15f0a348568781aab037c863d91b05e2"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-1 rounded-full border border-blue-200 bg-white/70 backdrop-blur-sm text-blue-600 text-sm font-medium gap-2 shadow-sm hover:bg-white/90 transition-colors"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
              We&apos;re in beta. Send us your feedback and ideas →
            </a>
          </div>
        )}

        {/* Mobile Beta Badge */}
        {isMobile && !isFullscreen && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-full flex justify-center px-4">
            <a
              href="https://livepeer.notion.site/15f0a348568781aab037c863d91b05e2"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-2 rounded-full border border-blue-200 bg-white/70 backdrop-blur-sm text-blue-600 text-xs font-medium gap-1.5 shadow-sm hover:bg-white/90 transition-colors w-full justify-center"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              We&apos;re in beta. Send us your feedback →
            </a>
          </div>
        )}

        {!isMobile && !isFullscreen && (
          <>
            <div className="absolute bottom-3 left-0 flex items-center">
              <TrackedButton
                trackingEvent="daydream_back_to_explore_clicked"
                trackingProperties={{
                  is_authenticated: authenticated,
                  is_guest_mode: isGuestMode,
                  via_overlay: true,
                }}
                variant="ghost"
                size="sm"
                className="h-8 gap-2 rounded-md"
                onClick={handleExploreClick}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Explore more prompts</span>
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
                  <ClipButton
                    trackAnalytics={track}
                    isAuthenticated={false}
                    isGuestMode={true}
                    onRecordAttempt={handleGuestRecordClip}
                    className="mr-2 rounded-md"
                  />
                ) : (
                  isPlaying &&
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
        <div className="z-50 flex justify-between w-full px-4 mt-6">
          <Button
            variant="ghost"
            size="icon"
            className="font-normal p-0 m-0 bg-transparent border-none hover:bg-transparent focus:outline-none rounded-md"
            onClick={handleExploreClick}
          >
            <ChevronLeft />
            <span>More prompts</span>
          </Button>

          <div className="flex gap-2 justify-end max-w-[60%]">
            {isGuestMode ? (
              <ClipButton
                trackAnalytics={track}
                isAuthenticated={false}
                isGuestMode={true}
                onRecordAttempt={handleGuestRecordClip}
                isMobile={true}
                className="rounded-md"
              />
            ) : (
              isPlaying &&
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

            <Link target="_blank" href="https://discord.gg/5sZu8xmn6U">
              <Button
                variant="ghost"
                size="icon"
                className="p-0 m-0 bg-transparent border-none hover:bg-transparent focus:outline-none rounded-md"
              >
                <DiscordLogoIcon className="h-4 w-4" />
              </Button>
            </Link>

            <div className="flex items-center">
              <SidebarTrigger />
            </div>
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
