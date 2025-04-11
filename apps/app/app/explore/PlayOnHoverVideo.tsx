"use client";

import { cn } from "@repo/design-system/lib/utils";
import { useRef } from "react";

export default function PlayOnHoverVideo({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const onMouseEnter = () => {
    ref.current?.play();
  };
  const onMouseLeave = () => {
    ref.current?.pause();
  };

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      className={cn("size-full object-cover object-top", className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
}
