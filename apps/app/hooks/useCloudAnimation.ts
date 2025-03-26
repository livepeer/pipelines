import { useState, useEffect, useRef } from "react";

interface CloudAnimationResult {
  containerRef: React.RefObject<HTMLDivElement>;
  getCloudTransform: (layerIndex: number) => string;
}

export default function useCloudAnimation(
  stepIndex: number,
): CloudAnimationResult {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 4;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 4;
        setMousePosition({ x, y });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const getCloudTransform = (layerIndex: number) => {
    const zoomFactor = 1 + stepIndex * (0.05 + layerIndex * 0.02);

    const baseLayerIndex = layerIndex % 3;

    let moveX = mousePosition.x * (2 + baseLayerIndex * 1.5);
    let moveY = mousePosition.y * (2 + baseLayerIndex * 1.5);

    if (layerIndex % 2 === 1) {
      moveX = -moveX;
    }

    if (layerIndex % 3 === 0) {
      moveY = -moveY * 0.7;
    }

    const stepShiftX =
      layerIndex % 2 === 0 ? stepIndex * 1.5 : stepIndex * -1.5;
    const stepShiftY = layerIndex % 3 === 0 ? stepIndex * 1 : stepIndex * -0.5;

    return `translate(${moveX + stepShiftX}px, ${moveY + stepShiftY}px) scale(${zoomFactor})`;
  };

  return {
    containerRef,
    getCloudTransform,
  };
}
