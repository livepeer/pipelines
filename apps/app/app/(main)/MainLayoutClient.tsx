"use client";

import { usePathname } from "next/navigation";
import { BentoGrids, BentoGridsProps } from "./BentoGrids";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

export default function MainLayoutClient({
  initialClips,
  children,
}: BentoGridsProps & { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <PageViewTracker eventName="explore_page_viewed" />
      <BentoGrids initialClips={initialClips} />
      {children}
    </>
  );
}
