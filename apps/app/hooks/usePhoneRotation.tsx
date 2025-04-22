import { useState, useEffect } from "react";

/**
 * A hook that detects device rotation using the Screen Orientation API
 * @param rotationDelay - Time in ms before rotation is considered complete (default: 500ms)
 * @returns isRotating - boolean indicating if the device is currently rotating
 */
export function usePhoneRotation(rotationDelay = 500) {
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    // Check if Screen Orientation API is supported
    const screenOrientation = window.screen?.orientation;
    if (!screenOrientation) {
      console.warn("Screen Orientation API is not supported in this browser");
      return;
    }

    let timer: NodeJS.Timeout;
    const handleOrientationChange = () => {
      clearTimeout(timer);
      setIsRotating(true);

      timer = setTimeout(() => {
        setIsRotating(false);
      }, rotationDelay);
    };

    // Use the Screen Orientation API to listen for changes
    screenOrientation.addEventListener("change", handleOrientationChange);

    return () => {
      screenOrientation.removeEventListener("change", handleOrientationChange);
      if (timer) clearTimeout(timer);
    };
  }, [rotationDelay]);

  return isRotating;
}
