"use client";

import { Logo } from "@/components/sidebar";
import { TrackedButton } from "@/components/analytics/TrackedButton";
import { usePreviewStore } from "@/hooks/usePreviewStore";
import { cn } from "@repo/design-system/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

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
        <div className="flex flex-1">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">Daydream by Livepeer</span>
            <Logo />
          </a>
        </div>
        <div className="flex flex-1 justify-end gap-4">
          <TrackedButton
            trackingEvent="explore_header_community_clicked"
            trackingProperties={{ location: "explore_header" }}
            variant="ghost"
            className="text-sm"
            onClick={() => {
              window.open(
                "https://discord.com/invite/hxyNHeSzCK",
                "_blank",
                "noopener noreferrer",
              );
            }}
          >
            Join Discord
          </TrackedButton>
          <Link href="/create">
            <TrackedButton
              trackingEvent="explore_header_start_creating_clicked"
              trackingProperties={{ location: "explore_header" }}
              variant="outline"
              className={cn(
                "alwaysAnimatedButton",
                isPreviewOpen && "opacity-0 pointer-events-none",
                "px-8",
              )}
            >
              Create
            </TrackedButton>
          </Link>
        </div>
      </nav>
    </header>
  );
}
