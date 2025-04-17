"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { WandSparkles } from "lucide-react";

export const RemixButton = () => {
  return (
    <Button
      className={cn(
        "flex items-center py-2 px-4 gap-2 font-medium cursor-pointer rounded-xl",
      )}
      onClick={e => e.stopPropagation()}
    >
      <WandSparkles className="size-1" />

      <span className="text-sm">Remix</span>
    </Button>
  );
};
