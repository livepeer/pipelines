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
import { usePrivy } from "@/hooks/usePrivy";
import { updateUserAdditionalDetails } from "@/app/actions/user";
import { Separator } from "@repo/design-system/components/ui/separator";
import track from "@/lib/track";
import { useState, useEffect } from "react";
import { Input } from "@repo/design-system/components/ui/input";
import { GradientAvatar } from "@/components/GradientAvatar";
import { RefreshCw } from "lucide-react";

interface WelcomeScreenProps {
  simplified?: boolean;
}

export default function WelcomeScreen({
  simplified = false,
}: WelcomeScreenProps) {
  const { currentStep, isFadingOut, setCurrentStep, setFadingOut } =
    useOnboard();
  const { setTheme } = useTheme();
  const { user } = usePrivy();
  const [displayName, setDisplayName] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("");

  const generateRandomSeed = () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9_.]/g, "");
    setDisplayName(sanitizedValue);
  };

  useEffect(() => {
    setAvatarSeed(generateRandomSeed());
  }, []);

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

  const handleContinueFromSimplifiedFlow = async () => {
    track("daydream_simplified_continue_clicked", {
      user_id: user?.id,
    });

    setFadingOut(true);

    setTimeout(() => {
      setCurrentStep("main");
      window && window.scrollTo({ top: 0, behavior: "instant" });
    }, 1000);

    if (user) {
      await updateUserAdditionalDetails(user, {
        next_onboarding_step: "main",
      });
    }
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
            isFadingOut ? "opacity-0" : "opacity-50",
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
          <div className="bg-gradient-to-b from-transparent to-white absolute inset-0 z-[7] opacity-[55%]"></div>
        </div>
        <div className="absolute inset-0 w-full h-full backdrop-blur-md z-[8]"></div>
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-y-auto">
        <div
          className={cn(
            "h-[fit-content] z-10 relative bg-[#EDEDED] p-[12px] sm:p-[20px] md:p-[48px] md:pb-6 rounded-[23px] w-[90%] sm:w-[80%] md:max-w-[812px]",
            currentStep === "prompt" && "mb-[100px] mt-[100px]",
            isFadingOut && "hidden",
          )}
        >
          <div className="flex flex-col gap-[16px] sm:gap-[20px] py-[12px]">
            <div className="flex flex-col w-full gap-[8px]">
              <h1 className="font-playfair font-bold text-[28px] sm:text-[40px] lg:text-[60px] leading-[1.2em] text-[#1C1C1C]">
                Welcome to Daydream
              </h1>

              <p className="font-playfair font-semibold text-base sm:text-lg md:text-xl text-[#1C1C1C]">
                ✨ From imagination to creation — all in real time.
              </p>
            </div>

            <div className="w-full h-px bg-[#D2D2D2]"></div>

            {!simplified ? (
              <div className="flex flex-col gap-[12px] sm:gap-[14px]">
                <p className="font-open-sans text-sm sm:text-base leading-[1.35em] text-[#232323]">
                  Come experience the magic of Daydream 🎭
                </p>
                <p className="font-open-sans text-sm sm:text-base leading-[1.35em] text-[#232323]">
                  Create without limits. Whether you&apos;re crafting stories,
                  building experiences, or experimenting with something entirely
                  new, this is your playground!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-[12px] sm:gap-[14px]">
                <p className="font-playfair font-semibold text-base sm:text-lg md:text-xl text-[#1C1C1C]">
                  Let&apos;s create your daydream profile
                </p>
                <p className="font-open-sans text-sm sm:text-base leading-[1.35em] text-[#232323]">
                  Your creative journey starts with who you are. Tell us a bit
                  about yourself so we can customize your experience
                </p>
              </div>
            )}

            <div className="flex flex-col gap-1 sm:gap-2">
              <p className="font-playfair font-semibold text-base sm:text-lg md:text-xl text-[#1C1C1C]">
                Choose a display name and avatar
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Enter your display name..."
                  value={displayName}
                  onChange={handleDisplayNameChange}
                  className="flex-grow bg-white border border-[#D2D2D2] rounded-md h-10 px-3 py-2"
                />
                <div className="flex items-center justify-between w-20 h-10 bg-white border border-[#D2D2D2] rounded-md pl-2 pr-1">
                  <GradientAvatar seed={avatarSeed} size={28} />
                  <button
                    type="button"
                    onClick={() => setAvatarSeed(generateRandomSeed())}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full focus:outline-none"
                    aria-label="Generate random avatar"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
            </div>

            <p className="font-playfair font-semibold text-base sm:text-lg md:text-xl text-[#1C1C1C]">
              {!simplified
                ? "But first, let's get to know you!"
                : "What describes you best?"}
            </p>

            <Personas simplified={simplified} />

            {!simplified && <CameraAccess />}

            {!simplified && <SelectPrompt />}

            {simplified && currentStep === "persona" && (
              <>
                <Separator className="bg-[#D2D2D2]" />
                <div className="flex justify-end w-full">
                  <button
                    onClick={handleContinueFromSimplifiedFlow}
                    className="bg-[#161616] w-full sm:max-w-[187px] text-[#EDEDED] px-6 py-3 rounded-md font-inter font-semibold text-[15px] hover:bg-[#2D2D2D] transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <Footer isFadingOut={isFadingOut} />
      </div>
    </LayoutWrapper>
  );
}
