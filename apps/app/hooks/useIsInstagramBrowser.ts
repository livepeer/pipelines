import { identifyInstagramInAppBrowser } from "@/lib/userAgentIdentify";
import { useState, useEffect } from "react";

export function useIsInstagramBrowser(): boolean {
  const [isInstagramBrowser, setIsInstagramBrowser] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsInstagramBrowser(identifyInstagramInAppBrowser(userAgent));
    }
  }, []);

  return isInstagramBrowser;
}
