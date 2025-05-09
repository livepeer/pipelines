// useIsTikTokBrowser.ts
import { useState, useEffect } from "react";

export function useIsTikTokBrowser(): boolean {
  const [isTikTokBrowser, setIsTikTokBrowser] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsTikTokBrowser(
        userAgent.includes("tiktok") ||
          userAgent.includes("musical_ly") ||
          userAgent.includes("bytedance"),
      );
    }
  }, []);

  return isTikTokBrowser;
}
