"use client";

import useCloudAnimation from "@/hooks/useCloudAnimation";
import { Button } from "@repo/design-system/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Camera, Play } from "lucide-react";
import { usePrivy } from "@/hooks/usePrivy";
import { useGuestUserStore } from "@/hooks/useGuestUser";
import TutorialModal from "./components/TutorialModal";

export default function HomePage() {
  const { containerRef, getCloudTransform } = useCloudAnimation(0);
  const router = useRouter();
  const { authenticated, ready } = usePrivy();
  const { setIsGuestUser } = useGuestUserStore();
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const redirectAsGuest = () => {
    setIsGuestUser(true);
    let b64Prompt = btoa(
      "((cubism)) tesseract ((flat colors)) --creativity 0.6 --quality 3",
    );
    router.push(`/create?inputPrompt=${b64Prompt}`);
  };

  useEffect(() => {
    // Check if user has already seen the landing page
    if (typeof window !== "undefined" && ready && !authenticated) {
      const hasSeenLanding = localStorage.getItem("hasSeenLandingPage");
      if (hasSeenLanding) {
        redirectAsGuest();
        return;
      }
      // Mark that user has seen the landing page
      localStorage.setItem("hasSeenLandingPage", "true");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (ready && authenticated) {
      router.push("/create");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (!authenticated && ready) {
      setAnimationStarted(true);
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 800); // Show content after clouds start appearing

      return () => clearTimeout(timer);
    }
  }, [authenticated, ready]);

  if (!ready) {
    return <div className="flex items-center justify-center h-screen"></div>;
  }

  if (authenticated) {
    return null;
  }

  const handleTryCameraClick = () => {
    redirectAsGuest();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div
        ref={containerRef}
        className="w-full h-full flex flex-col items-center justify-center relative"
      >
        {/* Cloud background */}
        <div
          className={`cloud-container absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${animationStarted ? "opacity-100" : "opacity-0"}`}
        >
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

        <div
          className={`z-10 p-8 max-w-4xl w-full mx-4 relative rounded-full transition-all duration-1000 ease-in-out ${showContent ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"}`}
        >
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
                Daydream is live video, transformed
              </h2>
            </div>

            <div className="mt-6 flex flex-row gap-4 w-full items-center justify-center">
              <Button
                className="min-w-[200px] px-6 h-12 rounded-md bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2"
                onClick={handleTryCameraClick}
              >
                <Camera className="h-4 w-4" />
                Try it with your camera
              </Button>
              <Button
                onClick={() => setIsTutorialModalOpen(true)}
                className="min-w-[200px] px-6 h-12 rounded-md alwaysAnimatedButton text-black flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4 stroke-2 fill-none" />
                Watch demo
              </Button>
            </div>
          </div>
        </div>

        <div
          className={`absolute bottom-10 z-10 text-center transition-all duration-1000 ease-in-out delay-200 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        >
          <Link
            href="/explore"
            className="text-gray-500 font-light text-sm tracking-wide"
          >
            Explore community creations
          </Link>
        </div>
      </div>

      <TutorialModal
        isOpen={isTutorialModalOpen}
        onClose={() => setIsTutorialModalOpen(false)}
      />
    </div>
  );
}
