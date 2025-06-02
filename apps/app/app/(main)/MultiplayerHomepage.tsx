"use client";

import { PromptItem } from "@/app/api/prompts/types";
import { CloudBackground } from "@/components/home/CloudBackground";
import { Footer } from "@/components/home/Footer";
import { HeaderSection } from "@/components/home/HeaderSection";
import { HeroSection } from "@/components/home/HeroSection";
import {
  VideoSection,
  useMultiplayerStreamStore,
} from "@/components/home/VideoSection";
import useCloudAnimation from "@/hooks/useCloudAnimation";
import { useGuestUserStore } from "@/hooks/useGuestUser";
import useMobileStore from "@/hooks/useMobileStore";
import useMount from "@/hooks/useMount";
import { usePrivy } from "@/hooks/usePrivy";
import track from "@/lib/track";
import { cn } from "@repo/design-system/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NewPromptPanel from "../NewPromptPanel";

export default function MultiplayerHomepage({
  children,
}: {
  children: React.ReactNode;
}) {
  const { containerRef, getCloudTransform } = useCloudAnimation(0);
  const router = useRouter();
  const { authenticated, ready } = usePrivy();
  const { setIsGuestUser } = useGuestUserStore();
  const [animationStarted, setAnimationStarted] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const promptFormRef = useRef<HTMLFormElement>(null);
  const [optimisticPrompts, setOptimisticPrompts] = useState<PromptItem[]>([]);
  const searchParams = useSearchParams();
  const utmSource = searchParams.get("utm_source");

  const { isMobile } = useMobileStore();
  const { currentStream } = useMultiplayerStreamStore();

  useMount(() => {
    track("home_page_viewed", {
      utm_source: utmSource,
    });
  });

  const redirectToCreate = () => {
    if (!authenticated) {
      setIsGuestUser(true);
    }
    let b64Prompt = btoa(
      "((cubism)) tesseract ((flat colors)) --creativity 0.6 --quality 3",
    );
    router.push(`/create?inputPrompt=${b64Prompt}`);
  };

  useEffect(() => {
    if (ready) {
      setAnimationStarted(true);
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [ready]);

  //   track("daydream_landing_page_prompt_submitted", {
  //     is_authenticated: authenticated,
  //     prompt: value,
  //     nsfw: result.wasCensored || false,
  //     stream_key: currentStream.streamKey,
  //   });
  // });

  const handleButtonClick = () => {
    redirectToCreate();
  };

  const submitPromptForm = () => {
    promptFormRef.current?.requestSubmit();
  };

  useEffect(() => {
    setOptimisticPrompts([]);
  }, [currentStream?.streamKey]);

  if (!ready) {
    return <div className="flex items-center justify-center h-screen"></div>;
  }

  if (!currentStream) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading prompt state...
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 w-screen h-screen overflow-hidden scrollbar-gutter-stable">
        <CloudBackground
          animationStarted={animationStarted}
          getCloudTransform={getCloudTransform}
        />
        {isMobile && (
          <HeaderSection
            onTryCameraClick={handleButtonClick}
            className="fixed backdrop-blur-sm transition-all duration-1000 ease-in-out"
          />
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
            <HeroSection isAuthenticated={authenticated} />
            <div
              id="player"
              className={cn(
                "relative flex flex-col gap-0 md:gap-8 w-full overflow-hidden h-[100vh]",
                isMobile && "h-[calc(100vh-3rem)]",
              )}
            >
              {!isMobile && (
                <HeaderSection
                  onTryCameraClick={handleButtonClick}
                  className="md:px-12"
                />
              )}
              <div
                className={cn(
                  "relative flex flex-1 flex-row w-full gap-6 h-[calc(100%-10rem)] md:px-12",
                  isMobile && "flex-col gap-0",
                )}
              >
                <VideoSection />
                <NewPromptPanel />

                {/* <PromptPanel
                  promptQueue={
                    promptState
                      ? [
                          ...optimisticPrompts.filter(
                            p => p.streamKey === currentStream?.streamKey,
                          ),
                          ...promptState.promptQueue,
                        ]
                      : []
                  }
                  displayedPrompts={promptState?.displayedPrompts || []}
                  promptAvatarSeeds={promptState?.promptAvatarSeeds || []}
                  userPromptIndices={promptState?.userPromptIndices || []}
                  onSubmit={handlePromptSubmit}
                  promptValue={prompt}
                  onPromptChange={handlePromptChange}
                  setPromptValue={setPrompt}
                  isThrottled={isThrottled}
                  throttleTimeLeft={throttleTimeLeft}
                  promptFormRef={promptFormRef}
                  isMobile={isMobile}
                /> */}
              </div>
              <Footer isMobile={isMobile} />
            </div>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
