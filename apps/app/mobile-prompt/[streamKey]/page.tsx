"use client";

import React from "react";
import { MobilePromptPanel } from "@/components/stream/MobilePromptPanel";

export default function MobilePromptPage({
  params,
}: {
  params: { streamKey: string };
}) {
  return (
    <div className="h-screen w-screen">
      <MobilePromptPanel streamKey={params.streamKey} />
    </div>
  );
}
