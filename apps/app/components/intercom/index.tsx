"use client";

import { useIsMobile } from "@repo/design-system/hooks/use-mobile";
import { useEffect } from "react";

export default function Intercom() {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      import("@intercom/messenger-js-sdk").then(IntercomClient => {
        IntercomClient.default({
          app_id: process.env.NEXT_PUBLIC_INTERCOM_APP_ID || "",
        });
      });
    }
  }, [isMobile]);

  return null;
}
