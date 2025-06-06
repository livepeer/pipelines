"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeProps {
  url: string;
  size?: number;
  className?: string;
}

export function QRCodeComponent({
  url,
  size = 80,
  className = "",
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !url) return;

    QRCode.toCanvas(
      canvasRef.current,
      url,
      {
        width: size,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      },
      error => {
        if (error) {
          console.error("QR Code generation error:", error);
        }
      },
    );
  }, [url, size]);

  return (
    <div className={`bg-white p-2 rounded-lg shadow-lg ${className}`}>
      <canvas
        ref={canvasRef}
        className="block"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
