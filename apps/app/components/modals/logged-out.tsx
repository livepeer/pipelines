"use client";

import React from "react";
import { Button } from "@repo/design-system/components/ui/button";
import track from "@/lib/track";
import { usePrivy } from "@/hooks/usePrivy";

export default function LoggedOut({ text }: { text: string }) {
  const { ready, authenticated, user, login } = usePrivy();

  const disableLogin = !ready || authenticated;

  return (
    <div className="flex justify-center h-[calc(100vh-15rem)] items-center">
      <Button
        onClick={() => {
          track("login_clicked", undefined, user || undefined);
          login();
        }}
        disabled={disableLogin}
        variant="outline"
        className="p-5"
      >
        {text}
      </Button>
    </div>
  );
}
