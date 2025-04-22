import { useState, useEffect } from "react";

/**
 * A simple hook that detects device rotation
 * @param rotationDelay - Time in ms before rotation is considered complete (default: 500ms)
 * @returns isRotating - boolean indicating if the device is currently rotating
 */
export function usePhoneRotation(rotationDelay = 500) {
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleOrientationChange = () => {
      clearTimeout(timer);
      setIsRotating(true);

      timer = setTimeout(() => {
        setIsRotating(false);
      }, rotationDelay);

      return () => clearTimeout(timer);
    };

    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, [rotationDelay]);

  return isRotating;
}
