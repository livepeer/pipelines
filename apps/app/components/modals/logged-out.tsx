"use client";

import React from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";

export default function LoggedOut({ text }: { text: string }) {
  const { ready, authenticated, user, login, logout } = usePrivy();

  const disableLogin = !ready || authenticated;

  return (
    <div className="flex justify-center h-[calc(100vh-15rem)] items-center">
      <Button
        onClick={() => {
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
