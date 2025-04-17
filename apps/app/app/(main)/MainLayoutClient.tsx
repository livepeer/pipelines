"use client";

import { usePathname } from "next/navigation";
import { BentoGrids, BentoGridsProps } from "./BentoGrids";

export default function MainLayoutClient({
  initialClips,
  children,
}: BentoGridsProps & { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <BentoGrids initialClips={initialClips} />
      {children}
    </>
  );
}
