"use client";
import { usePrivy } from "@privy-io/react-auth";

import { useEffect, useState } from "react";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/sidebar";
import { TrackedButton } from "@/components/analytics/TrackedButton";
import { usePreviewStore } from "@/hooks/usePreviewStore";
import { cn } from "@repo/design-system/lib/utils";
import VideoAISparkles from "components/daydream/CustomIcons/VideoAISparkles";
import { useCapacityCheck } from "@/hooks/useCapacityCheck";
import { useGuestUserStore } from "@/hooks/useGuestUser";
import { CapacityNotificationModal } from "@/components/modals/capacity-notification-modal";
import track from "@/lib/track";

export default function Header() {
  const { isPreviewOpen } = usePreviewStore();
  const [scrolled, setScrolled] = useState(false);
  const { hasCapacity } = useCapacityCheck();
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const router = useRouter();
  const { authenticated, ready } = usePrivy();
  const { setIsGuestUser } = useGuestUserStore();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!authenticated && ready) {
      setIsGuestUser(true);
    }

    if (!hasCapacity) {
      track("capacity_create_blocked", { location: "header" });
      setIsCapacityModalOpen(true);
    } else {
      router.push("/create");
    }
  };

  return (
    <>
      {/* Custom style to override alwaysAnimatedButton for the circular floating button */}
      <style jsx global>{`
        .circular-animated-button::before {
          border-radius: 9999px !important;
        }

        .floating-shadow {
          box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.3),
            0 8px 10px -6px rgba(0, 0, 0, 0.2),
            0 0 15px 2px rgba(0, 0, 0, 0.15);
        }

        .forced-white-bg {
          background: #ffffff !important;
        }
      `}</style>

      <header
        className={cn(
          "bg-transparent sticky top-0 z-50 transition-colors duration-300 ease-in-out",
          scrolled && "backdrop-filter backdrop-blur-xl bg-opacity-50",
        )}
      >
        <nav
          aria-label="Global"
          className="mx-auto flex items-center justify-between py-4 px-6 lg:px-8"
        >
          <div className="flex flex-1 items-center">
            <a href="#" className="-m-1.5 p-1.5 flex items-center">
              <span className="sr-only">Daydream by Livepeer</span>
              <Logo />
            </a>
          </div>

          {/* Centered Beta Badge */}
          <div className="flex-1 flex justify-center items-center">
            <a
              href="https://livepeer.notion.site/15f0a348568781aab037c863d91b05e2"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-1 rounded-full border border-blue-200 bg-white/70 backdrop-blur-sm text-blue-600 text-sm font-medium gap-2 shadow-sm hover:bg-white/90 transition-colors"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="sm:inline hidden">
                We&apos;re in beta. Send us your feedback and ideas →
              </span>
              <span className="sm:hidden inline">Beta</span>
            </a>
          </div>

          <div className="flex flex-1 justify-end">
            <TrackedButton
              trackingEvent="explore_header_community_clicked"
              trackingProperties={{ location: "explore_header" }}
              variant="default"
              className="text-sm rounded-md sm:px-4 aspect-square sm:aspect-auto"
              onClick={() => {
                window.open(
                  "https://discord.gg/5sZu8xmn6U",
                  "_blank",
                  "noopener noreferrer",
                );
              }}
            >
              <DiscordLogoIcon className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Join Discord</span>
            </TrackedButton>
            {/* Desktop-only Create button */}
            <div className="hidden sm:block ml-4" onClick={handleCreateClick}>
              <TrackedButton
                trackingEvent="explore_header_start_creating_clicked"
                trackingProperties={{ location: "explore_header" }}
                variant="outline"
                className={cn(
                  "alwaysAnimatedButton",
                  isPreviewOpen && "opacity-0 pointer-events-none",
                  "px-4",
                )}
              >
                <VideoAISparkles className={cn("text-black !w-10 !h-10")} />{" "}
                Create
              </TrackedButton>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile-only floating Create button */}
      <div
        className={cn(
          "fixed bottom-6 right-6 sm:hidden z-50",
          (isPreviewOpen || !hasCapacity) && "opacity-0 pointer-events-none",
        )}
      >
        <div className="rounded-full floating-shadow">
          <TrackedButton
            trackingEvent="explore_header_start_creating_clicked"
            trackingProperties={{ location: "explore_header_mobile_fab" }}
            size="lg"
            className={cn(
              "!rounded-full h-20 w-20 text-black flex items-center justify-center p-0",
              "alwaysAnimatedButton circular-animated-button forced-white-bg",
              isPreviewOpen && "opacity-0 pointer-events-none",
            )}
            onClick={handleCreateClick}
          >
            <VideoAISparkles className={cn("text-black !w-16 !h-16")} />
          </TrackedButton>
        </div>
      </div>

      <CapacityNotificationModal
        isOpen={isCapacityModalOpen}
        onClose={() => setIsCapacityModalOpen(false)}
      />
    </>
  );
}
