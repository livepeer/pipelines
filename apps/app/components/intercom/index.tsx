"use client";

import { useEffect } from "react";

export default function Intercom() {
  useEffect(() => {
    import("@intercom/messenger-js-sdk").then(IntercomClient => {
      IntercomClient.default({
        app_id: process.env.NEXT_PUBLIC_INTERCOM_APP_ID || "",
      });
    });
  }, []);

  return null;
}
