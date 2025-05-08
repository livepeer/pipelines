"use client";

import useCloudAnimation from "@/hooks/useCloudAnimation";
import { Button } from "@repo/design-system/components/ui/button";
import { usePrivy } from "@/hooks/usePrivy";
import track from "@/lib/track";
import { useEffect } from "react";
import useMobileStore from "@/hooks/useMobileStore";
import { DiscordLogoIcon } from "@radix-ui/react-icons";

interface UnifiedSignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: "trial_expired" | "prompt_limit" | "share" | null;
}

export function UnifiedSignupModal({
  open,
  onOpenChange,
  reason,
}: UnifiedSignupModalProps) {
  const { login } = usePrivy();
  const { containerRef, getCloudTransform } = useCloudAnimation(0);
  const { isMobile } = useMobileStore();

  useEffect(() => {
    if (open) {
      track("unified_signup_modal_shown", {
        reason,
      });
    }
  }, [open, reason]);

  if (!open) return null;

  const getTitle = () => {
    switch (reason) {
      case "trial_expired":
        return <>Your creative journey is just beginning</>;
      case "prompt_limit":
        return <>Your creative journey is just beginning</>;
      case "share":
        return <>Your creative journey is just beginning</>;
      default:
        return <>Your creative journey is just beginning</>;
    }
  };

  const getDescription = () => {
    switch (reason) {
      case "trial_expired":
        return "Create a free account to continue";
      case "prompt_limit":
        return "Create a free account to continue";
      case "share":
        return "Create a free account to continue";
      default:
        return "Create a free account to continue";
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      onClick={() => onOpenChange(false)}
    >
      <div
        ref={containerRef}
        className="w-full h-full flex flex-col items-center justify-center relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Cloud background */}
        <div className="cloud-container absolute inset-0 z-0">
          <div
            className="cloud-layer"
            id="cloud1"
            style={{
              transform: getCloudTransform(0),
              opacity: 0.5,
            }}
          ></div>
          <div
            className="cloud-layer"
            id="cloud2"
            style={{
              transform: getCloudTransform(1),
              opacity: 0.5,
            }}
          ></div>
          <div
            className="cloud-layer"
            id="cloud3"
            style={{
              transform: getCloudTransform(2),
              opacity: 0.5,
            }}
          ></div>
          <div
            className="cloud-layer"
            id="cloud4"
            style={{
              transform: getCloudTransform(3),
              opacity: 0.5,
            }}
          ></div>
          <div
            className="cloud-layer"
            id="cloud5"
            style={{
              transform: getCloudTransform(4),
              opacity: 0.5,
            }}
          ></div>
          <div
            className="cloud-layer"
            id="cloud6"
            style={{
              transform: getCloudTransform(5),
              opacity: 0.5,
            }}
          ></div>
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

        <div className="z-10 p-8 max-w-4xl w-full mx-4 relative rounded-full">
          <div
            className="absolute -inset-8 blur-lg z-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(254,254,254,0.2) 30%, rgba(254,254,254,0.8) 60%, rgba(254,254,254,0.2) 80%, rgba(254,254,254,0) 100%)",
              pointerEvents: "none",
            }}
          ></div>

          <div className="flex flex-col items-center justify-center relative z-10">
            <div className="mb-4 relative z-10">
              <div className="p-2 rounded-full flex items-center justify-center">
                <svg
                  className="translate-x-2"
                  width="50"
                  height="50"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0.305908 14.4529L0.305908 17.5L3.2968 17.5L3.2968 14.4529L0.305908 14.4529ZM0.305908 7.39808L0.305908 10.4451L3.2968 10.4451L3.2968 7.39808L0.305908 7.39808ZM13.2147 7.39808L13.2147 10.4451L16.2056 10.4451L16.2056 7.39808L13.2147 7.39808ZM0.305908 3.54706L0.305907 0.499996L3.2968 0.499996L3.2968 3.54706L0.305908 3.54706ZM6.76031 6.91402L6.76031 3.86696L9.75121 3.86696L9.75121 6.91402L6.76031 6.91402ZM6.76031 10.9258L6.76031 13.9728L9.75121 13.9728L9.75121 10.9258L6.76031 10.9258Z"
                    fill="#2E2E2E"
                  />
                </svg>
              </div>
            </div>

            <div className="w-full flex justify-center">
              <h2 className="text-balance text-center text-4xl font-extralight tracking-tight text-gray-950 sm:text-6xl whitespace-nowrap">
                {getTitle()}
              </h2>
            </div>

            <p className="mt-6 text-base text-gray-600 text-center max-w-md">
              {getDescription()}
            </p>

            <div className="mt-6 flex flex-row gap-4 w-full items-center justify-center">
              <Button
                className="w-48 px-12 h-12 rounded-md bg-black text-white hover:bg-gray-800"
                onClick={() => {
                  window.open(
                    "https://discord.gg/DwBPjfhmUt",
                    "_blank",
                    "noopener noreferrer",
                  );
                }}
              >
                <DiscordLogoIcon className="h-4 w-4" /> Join Discord
              </Button>
              <Button
                onClick={e => {
                  localStorage.setItem(
                    "daydream_from_guest_experience",
                    "true",
                  );
                  location.href = "/create";
                }}
                className="w-48 px-12 h-12 rounded-md alwaysAnimatedButton text-black"
              >
                Sign up
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 z-10 text-center">
          <a
            href="/"
            className="text-gray-500 font-light text-sm tracking-wide"
          >
            Back to browsing
          </a>
        </div>
      </div>
    </div>
  );
}
