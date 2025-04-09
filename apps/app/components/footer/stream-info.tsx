"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@repo/design-system/lib/utils";
import { useDreamshaperStore } from "@/hooks/useDreamshaper";
import useFullscreenStore from "@/hooks/useFullscreenStore";

export function StreamInfo({ className }: { className?: string }) {
  const { stream } = useDreamshaperStore();
  const { isFullscreen } = useFullscreenStore();

  const [copied, setCopied] = useState(false);
  const appVersion =
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev";

  const handleCopy = async () => {
    const fullInfo = {
      version: appVersion,
      browser: navigator.userAgent,
      path: window.location.pathname,
      streamId: stream?.id || "not-available",
      streamKey: stream?.stream_key || "not-available",
    };

    await navigator.clipboard.writeText(JSON.stringify(fullInfo, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!stream?.id) {
    return <></>;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-20 flex items-center gap-2 text-xs text-gray-500 z-10",
        isFullscreen && "hidden",
        className,
      )}
    >
      <span>v{appVersion}</span>
      <button
        onClick={handleCopy}
        className="hover:text-gray-700 transition-colors"
        title="Copy system info"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}
