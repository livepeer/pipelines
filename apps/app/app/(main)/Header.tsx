"use client";

import { Logo } from "@/components/sidebar";
import { TrackedButton } from "@/components/analytics/TrackedButton";
import { usePreviewStore } from "@/hooks/usePreviewStore";
import { cn } from "@repo/design-system/lib/utils";
import Link from "next/link";

export default function Header() {
  const { isPreviewOpen } = usePreviewStore();

  return (
    <header className="bg-transparent sticky top-0 z-50 backdrop-filter backdrop-blur-xl bg-opacity-50">
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
        <div className="flex flex-1 justify-end">
          <TrackedButton
            trackingEvent="explore_header_start_creating_clicked"
            trackingProperties={{ location: "explore_header" }}
            variant="outline"
            className={cn(
              "alwaysAnimatedButton",
              isPreviewOpen && "opacity-0 pointer-events-none",
            )}
          >
            Create
          </TrackedButton>
        </div>
      </nav>
    </header>
  );
}
