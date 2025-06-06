"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Separator } from "@repo/design-system/components/ui/separator";
import { Logo } from "@/components/sidebar";
import Link from "next/link";
import { useState } from "react";
import { TrackedButton } from "@/components/analytics/TrackedButton";

interface BrowserFallbackProps {
  platform: "tiktok" | "instagram";
}

export default function BrowserFallback({ platform }: BrowserFallbackProps) {
  const linkToCopy = `https://daydream.live/?utm_source=${platform}&utm_medium=browser_fallback`;
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(linkToCopy);

    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  };

  return (
    <div className="h-screen w-screen flex justify-center items-center bg-white relative">
      <div className="absolute top-6 left-7">
        <Link href="/">
          <Logo className="h-8" />
        </Link>
      </div>
      <div className="max-w-md space-y-10 px-5">
        <div>
          <h2 className="font-bold text-2xl text-center">
            For the best experience, please use Safari or Chrome browser.
          </h2>
        </div>
        <Separator />
        <div className="flex justify-between border border-neutral-300 rounded-full py-2 pl-6 pr-3">
          <input
            type="text"
            value={linkToCopy}
            className="focus:outline-none bg-inherit"
            readOnly
          />
          <TrackedButton
            className="rounded-full"
            onClick={handleCopyLink}
            disabled={isCopied}
            trackingEvent={`${platform}_browser_fallback_link_copy`}
          >
            {isCopied ? "Copied!" : "Copy link"}
          </TrackedButton>
        </div>
      </div>
    </div>
  );
}
