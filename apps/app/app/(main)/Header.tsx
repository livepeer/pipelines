"use client";

import { Logo } from "@/components/sidebar";
import { TrackedButton } from "@/components/analytics/TrackedButton";
import { usePreviewStore } from "@/hooks/usePreviewStore";
import { cn } from "@repo/design-system/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DiscordLogoIcon, ChatBubbleIcon } from "@radix-ui/react-icons";
import VideoAISparkles from "components/daydream/CustomIcons/VideoAISparkles";

export default function Header() {
  const { isPreviewOpen } = usePreviewStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
          "bg-transparent sticky top-0 z-40 transition-colors duration-300 ease-in-out",
          scrolled && "backdrop-filter backdrop-blur-xl bg-opacity-50",
        )}
      >
        <nav
          aria-label="Global"
          className="mx-auto flex items-center justify-between py-4 px-4 sm:px-6 lg:px-8"
        >
          <div className="flex flex-1">
            <a href="#" className="-m-1.5 p-1.5 flex items-center gap-1.5">
              <span className="sr-only">Daydream by Livepeer</span>
              <Logo />
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white text-gray-500 border border-gray-200">
                Beta
              </span>
            </a>
          </div>
          <div className="flex flex-1 justify-end items-center gap-4">
            <TrackedButton
              trackingEvent="explore_header_community_clicked"
              trackingProperties={{ location: "explore_header" }}
              variant="default"
              className="text-sm rounded-md px-2 sm:px-4"
              onClick={() => {
                window.open(
                  "https://discord.com/invite/hxyNHeSzCK",
                  "_blank",
                  "noopener noreferrer",
                );
              }}
            >
              <DiscordLogoIcon className="h-4 w-4" /> Join Discord
            </TrackedButton>
            <TrackedButton
              trackingEvent="explore_header_feedback_clicked"
              trackingProperties={{ location: "explore_header" }}
              variant="ghost"
              className="text-sm text-gray-500 hover:text-gray-900"
              title="Share your feedback to help us improve"
              onClick={() => {
                window.open(
                  "https://livepeer.notion.site/15f0a348568781aab037c863d91b05e2",
                  "_blank",
                  "noopener noreferrer",
                );
              }}
            >
              <ChatBubbleIcon className="h-4 w-4" />
              <span className="sr-only">Share Feedback</span>
            </TrackedButton>
            {/* Desktop-only Create button */}
            <Link href="/create" className="hidden sm:block ml-4">
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
            </Link>
          </div>
        </nav>
      </header>

      {/* Mobile-only floating Create button */}
      <Link
        href="/create"
        className={cn(
          "fixed bottom-6 right-6 sm:hidden z-50",
          isPreviewOpen && "opacity-0 pointer-events-none",
        )}
      >
        <div className="rounded-full floating-shadow">
          <TrackedButton
            trackingEvent="explore_header_start_creating_clicked"
            trackingProperties={{ location: "explore_header_mobile_fab" }}
            size="lg"
            className={cn(
              "!rounded-full h-16 w-16 text-black flex items-center justify-center p-0",
              "alwaysAnimatedButton circular-animated-button forced-white-bg",
              isPreviewOpen && "opacity-0 pointer-events-none",
            )}
          >
            <VideoAISparkles className={cn("text-black !w-12 !h-12")} />
          </TrackedButton>
        </div>
      </Link>
    </>
  );
}
