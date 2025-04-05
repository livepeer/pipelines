import * as React from "react";

const MOBILE_BREAKPOINT_WIDTH = 768;
const MOBILE_BREAKPOINT_HEIGHT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT_WIDTH - 1}px) or (max-height: ${MOBILE_BREAKPOINT_HEIGHT - 1}px)`,
    );
    const onChange = () => {
      setIsMobile(
        window.innerWidth < MOBILE_BREAKPOINT_WIDTH ||
          window.innerHeight < MOBILE_BREAKPOINT_HEIGHT,
      );
    };
    mql.addEventListener("change", onChange);
    setIsMobile(
      window.innerWidth < MOBILE_BREAKPOINT_WIDTH ||
        window.innerHeight < MOBILE_BREAKPOINT_HEIGHT,
    );
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
