"use client";

import Image from "next/image";
import Personas from "./Personas";
import CameraAccess from "./CameraAccess";
import Footer from "./Footer";
import { useOnboard } from "../OnboardContext";
import SelectPrompt from "./SelectPrompt";
import LayoutWrapper from "../LayoutWrapper";
import useMount from "@/hooks/useMount";
import { useTheme } from "next-themes";
import { cn } from "@repo/design-system/lib/utils";
import { useRef, useState, useEffect } from "react";

export default function WelcomeScreen() {
  const { currentStep, isFadingOut } = useOnboard();
  const { setTheme } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useMount(() => {
    setTheme("light");
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 4; // -1 to 1
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 4; // -1 to 1
        setMousePosition({ x, y });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const getStepIndex = () => {
    switch (currentStep) {
      case "persona": return 1;
      case "camera": return 2;
      case "prompt": return 3;
      default: return 0;
    }
  };

  const stepIndex = getStepIndex();

  if (currentStep === "main") {
    return null;
  }

  const getCloudTransform = (layerIndex: number) => {
    const zoomFactor = 1 + stepIndex * (0.02 + layerIndex * 0.01);
    
    const baseLayerIndex = layerIndex % 3;
    
    const moveX = mousePosition.x * (5 + baseLayerIndex * 3); 
    const moveY = mousePosition.y * (5 + baseLayerIndex * 3);
    
    return `translate(${moveX}px, ${moveY}px) scale(${zoomFactor})`;
  };

  return (
    <LayoutWrapper>
      <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center relative overflow-y-auto">
        <div className={cn("cloud-container absolute inset-0 z-0", isFadingOut ? "opacity-0" : "opacity-100", "transition-opacity duration-1000")}>
          <div className="cloud-layer" id="cloud1" style={{ transform: getCloudTransform(0) }}></div>
          <div className="cloud-layer" id="cloud2" style={{ transform: getCloudTransform(1) }}></div>
          <div className="cloud-layer" id="cloud3" style={{ transform: getCloudTransform(2) }}></div>
          <div className="cloud-layer" id="cloud4" style={{ transform: getCloudTransform(3) }}></div>
          <div className="cloud-layer" id="cloud5" style={{ transform: getCloudTransform(4) }}></div>
          <div className="cloud-layer" id="cloud6" style={{ transform: getCloudTransform(5) }}></div>
          <div className="bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.2)] absolute inset-0 z-[7] opacity-[55%]"></div>
        </div>
        <div
          className={cn(
            "h-[fit-content] z-10 relative bg-[#EDEDED] p-[16px] sm:p-[24px] sm:pb-4 md:p-[56px] md:pb-6 rounded-[23px] w-[90%] sm:w-[80%] md:max-w-[812px]",
            currentStep === "prompt" && "mb-[100px] mt-[100px]",
            isFadingOut && "hidden",
          )}
        >
          <div className="flex flex-col gap-[24px] py-[12px]">
            <div className="flex flex-col w-full gap-[8px]">
              <h1 className="font-playfair font-bold text-[30px] sm:text-[45px] lg:text-[64px] leading-[1.2em] text-[#1C1C1C]">
                Welcome to Daydream
              </h1>

              <p className="font-playfair font-semibold text-[18px] sm:text-xl md:text-2xl text-[#1C1C1C]">
                ✨ Dream it. Build it. Share it.
              </p>
            </div>

            <div className="w-full h-px bg-[#D2D2D2]"></div>

            <div className="flex flex-col gap-[16px]">
              <p className="font-open-sans text-base sm:text-lg leading-[1.35em] text-[#232323]">
                Daydream is a <span className="font-black">limitless</span>{" "}
                portal for transforming your video 🚀
              </p>
              <p className="font-open-sans text-base sm:text-lg leading-[1.35em] text-[#232323]">
                Whether you're crafting stories, building experiences, or
                experimenting with something entirely new, this is your
                playground.
              </p>
            </div>

            <p className="font-playfair font-semibold text-[18px] sm:text-xl md:text-2xl text-[#1C1C1C]">
              But first, let's get to know you!
            </p>

            <Personas />

            <CameraAccess />

            <SelectPrompt />
          </div>
        </div>
        <Footer isFadingOut={isFadingOut} />

        <style jsx>{`
          .cloud-container {
            position: absolute;
            width: 100%;
            height: 100%;
            background-color: #e0f0ff;
            overflow: hidden;
          }
          
          .cloud-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            transition: transform 2s ease-out;
            will-change: transform;
          }
          
          #cloud1 {
            background-image: url('/clouds/back_1.png');
            opacity: 0.5;
            z-index: 1;
          }
          
          #cloud2 {
            background-image: url('/clouds/back_2.png');
            opacity: 0.5;
            z-index: 2;
          }
          
          #cloud3 {
            background-image: url('/clouds/back_3.png');
            opacity: 0.5;
            z-index: 4;
          }
          
          #cloud4 {
            background-image: url('/clouds/back_1_proc.png');
            opacity: 0.3;
            z-index: 2;
          }

          #cloud5 {
            background-image: url('/clouds/back_4_proc.png');
            opacity: 0.3;
            z-index: 3;
          }

          #cloud6 {
            background-image: url('/clouds/back_3_proc.png');
            opacity: 0.3;
            z-index: 1;
          }
          
        `}</style>
      </div>
    </LayoutWrapper>
  );
}
