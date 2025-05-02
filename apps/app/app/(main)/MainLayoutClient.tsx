"use client";

import { BentoGrids, BentoGridsProps } from "./BentoGrids";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { CapacityToast } from "@/components/modals/capacity-toast";
import { useCapacityCheck } from "@/hooks/useCapacityCheck";
import { useCapacityToastStore } from "@/hooks/useCapacityToast";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function MainLayoutClient({
  initialClips,
  children,
}: BentoGridsProps & { children: React.ReactNode }) {
  const { hasCapacity } = useCapacityCheck();
  const pathname = usePathname();
  const { resetToastState } = useCapacityToastStore();

  useEffect(() => {
    if (pathname === "/") {
      resetToastState();
    }
  }, [pathname, resetToastState]);

  return (
    <>
      <PageViewTracker eventName="explore_page_viewed" />
      <CapacityToast path="/" hasCapacity={hasCapacity} />
      <BentoGrids initialClips={initialClips} hasCapacity={hasCapacity} />
      {children}
    </>
  );
}
