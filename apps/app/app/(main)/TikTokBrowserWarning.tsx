"use client";

import { useIsTikTokBrowser } from "@/hooks/useIsTikTokBrowser";

export default function TikTokBrowserWarning() {
  const isTikTokBrowser = useIsTikTokBrowser();

  if (!isTikTokBrowser) return null;

  return (
    <div
      className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-4"
      role="alert"
    >
      <p className="font-bold">Warning!</p>
      <p>
        Some features may be limited in the TikTok browser. For the best
        experience, please use Safari or Chrome browser.
      </p>
    </div>
  );
}
