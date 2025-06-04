"use client";

import { CloudBackground } from "@/components/home/CloudBackground";
import { Footer } from "@/components/home/Footer";
import { HeaderSection } from "@/components/home/HeaderSection";
import { HeroSection } from "@/components/home/HeroSection";
import {
  VideoSection,
  useMultiplayerStreamStore,
} from "@/components/home/VideoSection";
import useCloudAnimation from "@/hooks/useCloudAnimation";
import useMobileStore from "@/hooks/useMobileStore";
import useMount from "@/hooks/useMount";
import { usePrivy } from "@/hooks/usePrivy";
import track from "@/lib/track";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import PromptPanel from "../PromptPanel";

export default function MultiplayerHomepage({
  children,
}: {
  children: React.ReactNode;
}) {
  const { containerRef, getCloudTransform } = useCloudAnimation(0);
  const { ready } = usePrivy();
  const [animationStarted, setAnimationStarted] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const searchParams = useSearchParams();
  const utmSource = searchParams.get("utm_source");

  const { isMobile } = useMobileStore();
  const { currentStream } = useMultiplayerStreamStore();

  useMount(() => {
    track("home_page_viewed", {
      utm_source: utmSource,
    });
  });

  useEffect(() => {
    if (ready) {
      setAnimationStarted(true);
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [ready]);

  if (!ready || !currentStream) {
    return <></>;
  }

  return (
    <>
      <div className="fixed inset-0 w-screen h-screen overflow-hidden scrollbar-gutter-stable">
        <CloudBackground
          animationStarted={animationStarted}
          getCloudTransform={getCloudTransform}
        />
        {isMobile && (
          <HeaderSection className="fixed backdrop-blur-sm transition-all duration-1000 ease-in-out" />
        )}

        <div
          ref={containerRef}
          className="w-full h-full flex flex-col justify-start relative overflow-y-auto scrollbar-gutter-stable"
        >
          <div
            className={`z-10 w-full p-0 md:pt-0 flex flex-col transition-all duration-1000 ease-in-out ${
              showContent ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
            }`}
          >
            <HeroSection />
            <div
              id="player"
              className="relative flex flex-col gap-0 md:gap-8 w-full overflow-hidden h-[calc(100vh-3rem)] md:h-[100vh]"
            >
              {!isMobile && <HeaderSection className="md:px-12" />}
              <div className="relative flex flex-1 flex-col gap-0 md:flex-row w-full md:gap-6 h-[calc(100%-10rem)] md:px-12">
                <VideoSection />
                <PromptPanel />
              </div>
              <Footer />
            </div>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
