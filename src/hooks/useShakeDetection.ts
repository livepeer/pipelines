import { useState, useEffect } from 'react';

const SHAKE_THRESHOLD = 15; // Adjust this value based on testing
const SHAKE_TIMEOUT = 1000; // Minimum time between shake detections

export const useShakeDetection = (onShake: () => void) => {
  const [lastShake, setLastShake] = useState(0);

  useEffect(() => {
    let lastX: number, lastY: number, lastZ: number;

    const handleMotion = (event: DeviceMotionEvent) => {
      const current = Date.now();
      if ((current - lastShake) < SHAKE_TIMEOUT) return;

      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const { x, y, z } = acceleration;
      if (!x || !y || !z) return;

      const deltaX = Math.abs(x - (lastX || 0));
      const deltaY = Math.abs(y - (lastY || 0));
      const deltaZ = Math.abs(z - (lastZ || 0));

      if ((deltaX + deltaY + deltaZ) > SHAKE_THRESHOLD) {
        setLastShake(current);
        onShake();
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    };

    if (typeof window !== 'undefined' && 'DeviceMotion' in window) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [onShake]);
}; 