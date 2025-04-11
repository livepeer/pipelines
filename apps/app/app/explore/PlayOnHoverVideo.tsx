import { cn } from "@repo/design-system/lib/utils";
import { useRef } from "react";
import QuickviewVideo from "./QuickviewVideo";

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
    <QuickviewVideo src={src}>
      <video
        ref={ref}
        src={src}
        muted
        loop
        playsInline
        className={cn(
          "size-full object-cover object-top cursor-pointer",
          className,
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    </QuickviewVideo>
  );
}
