import { identifyMobileInAppBrowser } from "@/lib/userAgentIdentify";
import { useState, useEffect } from "react";

export function useIsMobileInAppBrowser(): boolean {
  const [isMobileInAppBrowser, setIsMobileInAppBrowser] =
    useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsMobileInAppBrowser(identifyMobileInAppBrowser(userAgent));
    }
  }, []);

  return isMobileInAppBrowser;
}
