import { identifyTikTokInAppBrowser } from "@/lib/userAgentIdentify";
import { useState, useEffect } from "react";

export function useIsTikTokBrowser(): boolean {
  const [isTikTokBrowser, setIsTikTokBrowser] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsTikTokBrowser(identifyTikTokInAppBrowser(userAgent));
    }
  }, []);

  return isTikTokBrowser;
}
