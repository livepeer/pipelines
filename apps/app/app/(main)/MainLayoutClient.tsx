"use client";

import { BentoGrids, BentoGridsProps } from "./BentoGrids";

export default function MainLayoutClient({
  initialClips,
  children,
}: BentoGridsProps & { children: React.ReactNode }) {
  return (
    <>
      <BentoGrids initialClips={initialClips} />
      {children}
    </>
  );
}
