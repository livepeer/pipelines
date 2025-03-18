import { useEffect, useRef } from "react";

export default function useScrollView(shouldScroll: boolean) {
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldScroll && componentRef.current) {
      componentRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "start",
      });
    }
  }, [shouldScroll]);

  return componentRef;
}
