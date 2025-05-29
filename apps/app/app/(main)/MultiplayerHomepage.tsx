"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { usePrivy } from "@/hooks/usePrivy";
import { useGuestUserStore } from "@/hooks/useGuestUser";
import useCloudAnimation from "@/hooks/useCloudAnimation";
import { usePromptsApi } from "@/hooks/usePromptsApi";
import { useThrottledInput } from "@/hooks/useThrottledInput";
import { useRandomPromptApiTimer } from "@/hooks/useRandomPromptApiTimer";
import { CloudBackground } from "@/components/home/CloudBackground";
import {
  VideoSection,
  useMultiplayerStreamStore,
} from "@/components/home/VideoSection";
import { PromptPanel } from "@/components/home/PromptPanel";
import { HeroSection } from "@/components/home/HeroSection";
import { Footer } from "@/components/home/Footer";
import track from "@/lib/track";
import { PromptItem } from "@/app/api/prompts/types";
import useMount from "@/hooks/useMount";
import { HeaderSection } from "@/components/home/HeaderSection";
import { cn } from "@repo/design-system/lib/utils";
import useMobileStore from "@/hooks/useMobileStore";

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
  const [useLivepeerPlayer, setUseLivepeerPlayer] = useState(false);

  const { isMobile } = useMobileStore();
  const { currentStream } = useMultiplayerStreamStore();

  useMount(() => {
    track("home_page_viewed", {
      utm_source: utmSource,
    });
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setUseLivepeerPlayer(urlParams.get("lpPlayer") === "true");
    }
  }, []);

  const {
    value: prompt,
    setValue: setPrompt,
    handleChange: handlePromptChange,
    handleSubmit: getHandleSubmit,
    isThrottled,
    throttleTimeLeft,
  } = useThrottledInput();

  const {
    promptState,
    loading,
    error,
    userAvatarSeed,
    addToPromptQueue,
    addRandomPrompt,
  } = usePromptsApi(currentStream?.streamKey);

  useRandomPromptApiTimer({
    authenticated,
    ready,
    showContent,
    addRandomPrompt,
  });

  const redirectToCreate = () => {
    if (!authenticated) {
      setIsGuestUser(true);
    }
    let b64Prompt = btoa(
      prompt ||
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

  const handlePromptSubmit = getHandleSubmit(async value => {
    if (!currentStream) return;

    const sessionId = "optimistic-" + Date.now();
    const optimisticPrompt: PromptItem = {
      text: value,
      seed: userAvatarSeed || "optimistic",
      isUser: true,
      timestamp: Date.now(),
      sessionId,
      streamKey: currentStream.streamKey,
    };
    setOptimisticPrompts(prev => [...prev, optimisticPrompt]);
    const result = await addToPromptQueue(value, userAvatarSeed, true);
    setOptimisticPrompts(prev => prev.filter(p => p.sessionId !== sessionId));

    track("daydream_landing_page_prompt_submitted", {
      is_authenticated: authenticated,
      prompt: value,
      nsfw: result.wasCensored || false,
      stream_key: currentStream.streamKey,
    });
  });

  const handleButtonClick = () => {
    redirectToCreate();
  };

  const submitPromptForm = () => {
    promptFormRef.current?.requestSubmit();
  };

  useEffect(() => {
    setOptimisticPrompts([]);
  }, [currentStream?.streamKey]);

  if (!ready || loading) {
    return <div className="flex items-center justify-center h-screen"></div>;
  }

  if (!promptState && currentStream) {
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
            className="fixed backdrop-blur-sm"
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
            <HeroSection
              handlePromptSubmit={handlePromptSubmit}
              promptValue={prompt}
              setPromptValue={setPrompt}
              submitPromptForm={submitPromptForm}
              isAuthenticated={authenticated}
              useLivepeerPlayer={useLivepeerPlayer}
            />
            <div
              id="player"
              className={cn(
                "relative flex flex-col gap-0 md:gap-8 w-full overflow-hidden h-[100vh]",
                isMobile && "h-[calc(100vh-3rem)]",
              )}
            >
              <div className="absolute inset-0 -z-10 opacity-50">
                <CloudBackground
                  animationStarted={animationStarted}
                  getCloudTransform={getCloudTransform}
                />
              </div>
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
                <PromptPanel
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
                />
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
