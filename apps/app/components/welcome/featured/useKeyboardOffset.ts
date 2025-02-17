import { useState, useEffect } from "react";

/**
 * Returns a bottom offset in pixels that accounts for the on-screen keyboard for mobile.
 * It adds both a default offset and an extra 50 pixels to cover keyboard helper UI.
 */
export default function useKeyboardOffset(defaultOffset: number = 8) {
  const additionalOffset = 50;
  const [bottomOffset, setBottomOffset] = useState(defaultOffset + additionalOffset);

  useEffect(() => {
    const updateOffset = () => {
      if (window.visualViewport) {
        const offset =
          window.innerHeight -
          (window.visualViewport.height + window.visualViewport.offsetTop) +
          defaultOffset +
          additionalOffset;
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
  }, [defaultOffset, additionalOffset]);

  return bottomOffset;
} 