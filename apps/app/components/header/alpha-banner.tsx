import Link from "next/link";
import React from "react";

export default function AlphaBanner() {
  const FEEDBACK_URL =
    "https://livepeer.notion.site/15f0a348568781aab037c863d91b05e2";

  return (
    <div className="bg-foreground text-background py-2 flex items-center justify-center mb-2 z-50">
      <p className="text-sm text-center">
      ⚠️ Early Access Preview: This is an early version of our real-time video AI platform. 
      You may encounter performance variations or unexpected behavior as we optimize the system. 
      Your feedback is crucial - 
 
        <Link
          href={FEEDBACK_URL}
          target="_blank"
          className="underline mx-1 underline-offset-2 hover:no-underline"
        >
          please share your experiences with us!
        </Link>
      </p>
    </div>
  );
}
