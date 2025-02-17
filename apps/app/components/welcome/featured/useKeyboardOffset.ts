import { useState, useEffect } from "react";

/**
 * Returns a bottom offset in pixels that accounts for the on-screen keyboard for mobile
 */
export default function useKeyboardOffset(defaultOffset: number = 8) {
  const [bottomOffset, setBottomOffset] = useState(defaultOffset);

  useEffect(() => {
    const updateOffset = () => {
      if (window.visualViewport) {
        const offset =
          window.innerHeight - (window.visualViewport.height + window.visualViewport.offsetTop) +
          defaultOffset;
        setBottomOffset(offset);
      }
    };

    updateOffset();
    window.visualViewport?.addEventListener("resize", updateOffset);
    window.visualViewport?.addEventListener("scroll", updateOffset);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateOffset);
      window.visualViewport?.removeEventListener("scroll", updateOffset);
    };
  }, [defaultOffset]);

  return bottomOffset;
} 