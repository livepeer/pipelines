"use client";

import { cn } from "@repo/design-system/lib/utils";
import { WandSparkles } from "lucide-react";

export const RemixButton = () => {
  return (
    <button
      className={cn(
        "alwaysAnimatedButton flex items-center py-2 px-4 gap-2 font-medium cursor-pointer",
      )}
      onClick={e => e.stopPropagation()}
    >
      <WandSparkles className="w-4 h-4" />
      <span className="text-sm">Remix</span>
    </button>
  );
};
