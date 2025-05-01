"use client";

import { Logo } from "@/components/sidebar";

// Add keyframe animation for the Beta tag pulse
const pulseKeyframes = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.8; }
    100% { opacity: 1; }
  }
`;

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style jsx global>{`
        ${pulseKeyframes}
        .beta-pulse {
          animation: pulse 2s infinite;
        }

        .beta-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #3B82F6;
          display: inline-block;
          margin-right: 4px;
          vertical-align: middle;
        }
      `}</style>
      <div className="flex flex-col w-full h-full">
        <div className="absolute top-4 left-4 z-50">
          <a href="/" className="flex items-center gap-1.5">
            <span className="sr-only">Daydream by Livepeer</span>
            <Logo />
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center beta-pulse">
              <span className="beta-dot"></span>
              Beta
            </span>
          </a>
        </div>
        {children}
      </div>
    </>
  );
}
