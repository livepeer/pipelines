"use client";

import { useGradientAvatar } from "@/hooks/useGradientAvatar";
import {
  Avatar as BaseAvatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/design-system/components/ui/avatar";
import { cn } from "@repo/design-system/lib/utils";
import { useMemo } from "react";

export interface GradientAvatarProps {
  seed?: string;
  src?: string;
  fallbackText?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

export function GradientAvatar({
  seed,
  src,
  fallbackText,
  size = 40,
  className,
  style,
  alt = "Avatar",
}: GradientAvatarProps) {
  const { generateAvatar } = useGradientAvatar({ size });

  const avatarSrc = useMemo(() => {
    if (src) return src;
    return generateAvatar(seed || fallbackText || "user");
  }, [src, seed, fallbackText, generateAvatar]);

  const fallback = useMemo(() => {
    const text = fallbackText || seed || "";
    return text.charAt(0).toUpperCase();
  }, [fallbackText, seed]);

  return (
    <BaseAvatar
      className={cn(className)}
      style={{ width: size, height: size, ...style }}
    >
      <AvatarImage src={avatarSrc} alt={alt} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </BaseAvatar>
  );
}
