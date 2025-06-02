import React from "react";

interface CloudBackgroundProps {
  animationStarted: boolean;
  getCloudTransform: (index: number) => string;
}

export function CloudBackground({
  animationStarted,
  getCloudTransform,
}: CloudBackgroundProps) {
  return (
    <div
      className={`cloud-container absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${
        animationStarted ? "opacity-100" : "opacity-0"
      }`}
    >
      {[...Array(6)].map((_, index) => (
        <div
          key={`cloud${index + 1}`}
          className="cloud-layer"
          id={`cloud${index + 1}`}
          style={{
            transform: getCloudTransform(index),
            opacity: 0.05,
          }}
        ></div>
      ))}
      <div
        className="absolute inset-0 z-[6]"
        style={{
          background:
            "radial-gradient(circle, transparent 0%, rgba(254, 254, 254, 0.9) 10%, rgba(254, 254, 254, 0.7) 20%, #fefefe 30%, rgba(254, 254, 254, 0) 85%)",
          pointerEvents: "none",
        }}
      ></div>
      <div
        className="absolute inset-0 z-[6] backdrop-blur-md"
        style={{ pointerEvents: "none" }}
      ></div>
      <div className="bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.2)] absolute inset-0 z-[7] opacity-[55%]"></div>
    </div>
  );
}
