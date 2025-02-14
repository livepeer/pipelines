"use client";
import { Button } from "@repo/design-system/components/ui/button";
import { XIcon } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

export default function AlphaBanner() {
  const [showBanner, setShowBanner] = useState(false); // Always non displayed for now
  const FEEDBACK_URL =
    "https://livepeer.notion.site/15f0a348568781aab037c863d91b05e2";

  if (!showBanner) return null;

  return (
    <div className="relative bg-foreground text-background py-2 flex items-center justify-center mb-2 z-50">
      <p className="text-sm text-center px-12">
        ⚠️ Early Access Preview: This is an early version of our real-time video
        AI platform. You may encounter performance variations or unexpected
        behavior as we optimize the system. Your feedback is crucial -
        <Link
          href={FEEDBACK_URL}
          target="_blank"
          className="underline mx-1 underline-offset-2 hover:no-underline"
        >
          please share your experiences with us!
        </Link>
      </p>
      <Button
        variant="link"
        onClick={() => setShowBanner(false)}
        className="absolute right-2 text-background"
      >
        <XIcon className="w-3 h-3" />
      </Button>
    </div>
  );
}
