"use client";

import useCloudAnimation from "@/hooks/useCloudAnimation";
import useMount from "@/hooks/useMount";
import { cn } from "@repo/design-system/lib/utils";
import { useTheme } from "next-themes";
import LayoutWrapper from "../LayoutWrapper";
import { useOnboard } from "../OnboardContext";
import CameraAccess from "./CameraAccess";
import Footer from "./Footer";
import Personas from "./Personas";
import SelectPrompt from "./SelectPrompt";

export default function WelcomeScreen() {
  const { currentStep, isFadingOut } = useOnboard();
  const { setTheme } = useTheme();

  useMount(() => {
    setTheme("light");
  });

  const getStepIndex = () => {
    switch (currentStep) {
      case "persona":
        return 1;
      case "camera":
        return 2;
      case "prompt":
        return 3;
      default:
        return 0;
    }
  };

  const stepIndex = getStepIndex();
  const { containerRef, getCloudTransform } = useCloudAnimation(stepIndex);

  const getFadeOutTransform = (cloudIndex: number): string => {
    if (!isFadingOut) return "";

    const scales = [1.5, 1.7, 1.4, 1.6, 1.3, 1.8];
    return `scale(${scales[cloudIndex % scales.length]})`;
  };

  const getCloudTransition = (cloudIndex: number): string => {
    if (!isFadingOut) return "transform 2s ease-out";
    return "transform 0.8s ease-out, opacity 0.7s ease-out";
  };

  if (currentStep === "main") {
    return null;
  }

  return (
    <LayoutWrapper>
      <div className="fixed top-0 left-0 w-full h-screen z-0">
        {/* Cloud container */}
        <div
          className={cn(
            "cloud-container absolute inset-0 w-full h-full",
            isFadingOut ? "opacity-0" : "opacity-100",
            "transition-opacity duration-1000",
          )}
          ref={containerRef}
        >
          <div
            className="cloud-layer"
            id="cloud1"
            style={{
              transform: `${getCloudTransform(0)} ${getFadeOutTransform(0)}`,
              transition: getCloudTransition(0),
            }}
          ></div>
          <div
            className="cloud-layer"
            id="cloud2"
            style={{
              transform: `${getCloudTransform(1)} ${getFadeOutTransform(1)}`,
              transition: getCloudTransition(1),
            }}
          ></div>
          <div
            className="cloud-layer"
            id="cloud3"
            style={{
              transform: `${getCloudTransform(2)} ${getFadeOutTransform(2)}`,
              transition: getCloudTransition(2),
            }}
          ></div>
          <div
            className="cloud-layer"
            id="cloud4"
            style={{
              transform: `${getCloudTransform(3)} ${getFadeOutTransform(3)}`,
              transition: getCloudTransition(3),
            }}
          ></div>
          <div
            className="cloud-layer"
            id="cloud5"
            style={{
              transform: `${getCloudTransform(4)} ${getFadeOutTransform(4)}`,
              transition: getCloudTransition(4),
            }}
          ></div>
          <div
            className="cloud-layer"
            id="cloud6"
            style={{
              transform: `${getCloudTransform(5)} ${getFadeOutTransform(5)}`,
              transition: getCloudTransition(5),
            }}
          ></div>
          <div className="bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.2)] absolute inset-0 z-[7] opacity-[55%]"></div>
        </div>
        <div className="absolute inset-0 w-full h-full backdrop-blur-md z-[8]"></div>
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-y-auto">
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
                Come experience the magic of Daydream 🎭
              </p>
              <p className="font-open-sans text-base sm:text-lg leading-[1.35em] text-[#232323]">
                Create without limits. Whether you&apos;re crafting stories,
                building experiences, or experimenting with something entirely
                new, this is your playground!
              </p>
            </div>

            <p className="font-playfair font-semibold text-[18px] sm:text-xl md:text-2xl text-[#1C1C1C]">
              But first, let&apos;s get to know you!
            </p>

            <Personas />

            <CameraAccess />

            <SelectPrompt />
          </div>
        </div>
        <Footer isFadingOut={isFadingOut} />
      </div>
    </LayoutWrapper>
  );
}
