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
  const { isOverlayOpen, setIsOverlayOpen, setOverlayType } = useOverlayStore();

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestModalReason, setGuestModalReason] = useState<
    "prompt_limit" | "record_clip" | "share" | null
  >(null);
  const [publishOpen, setPublishOpen] = useState(false);

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

  const handleOpenOverlay = () => {
    // First set type, then open overlay for smoother transition
    setOverlayType("bento");
    setIsOverlayOpen(true);

    track("daydream_sidebar_trigger_clicked", {
      is_authenticated: authenticated,
      is_guest_mode: isGuestMode,
    });
  };

  return (
    <>
      {/* Floating Sidebar Trigger */}
      {!isMobile && !isFullscreen && (
        <div
          className={cn(
            "fixed right-4 top-1/2 -translate-y-1/2 z-50",
            isOverlayOpen && "opacity-0 pointer-events-none",
          )}
        >
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full shadow-md bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-colors"
            onClick={handleOpenOverlay}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div
        className={cn(
          "flex w-full max-w-[calc(min(100%,calc((100vh-16rem)*16/9)))] mx-auto relative items-center",
          isFullscreen && "hidden",
          isMobile ? "justify-center px-3 py-3" : "justify-between py-3",
          isMinHeightScreen && "flex-col gap-6",
          "md:min-w-[596px]",
        )}
      >
        {/* Desktop Beta Badge */}
        {!isMobile && !isFullscreen && (
          <div className={cn("flex justify-center")}>
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
            <div
              className={cn(
                "flex gap-2 items-center",
                isMinHeightScreen && "relative",
              )}
            >
              <div className="flex items-center gap-2">
                {isPlaying &&
                  stream?.output_playback_id &&
                  streamUrl &&
                  (isGuestMode ? (
                    <ClipButton
                      trackAnalytics={track}
                      isAuthenticated={false}
                      isGuestMode={true}
                      onRecordAttempt={handleGuestRecordClip}
                      className="mr-2 rounded-md"
                    />
                  ) : (
                    <ClipButton
                      className="mr-2 rounded-md"
                      disabled={!stream?.output_playback_id || !streamUrl}
                      trackAnalytics={track}
                      isAuthenticated={authenticated}
                    />
                  ))}
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
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2 rounded-md"
                  onClick={() => setPublishOpen(true)}
                >
                  Publish Experience
                </Button>
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
            </div>
          </>
        )}
      </div>

      {isMobile && (
        <div className="z-50 flex justify-between w-full px-4 mt-6">
          <div className="flex-1"></div>
          <div className="flex gap-2 justify-end max-w-[60%]">
            {isPlaying &&
              stream?.output_playback_id &&
              streamUrl &&
              (isGuestMode ? (
                <ClipButton
                  trackAnalytics={track}
                  isAuthenticated={false}
                  isGuestMode={true}
                  onRecordAttempt={handleGuestRecordClip}
                  isMobile={true}
                  className="rounded-md"
                />
              ) : (
                <ClipButton
                  disabled={!stream?.output_playback_id || !streamUrl}
                  trackAnalytics={track}
                  isAuthenticated={authenticated}
                  isMobile={true}
                  className="rounded-md"
                />
              ))}

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

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
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
