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
import { VideoSection } from "@/components/home/VideoSection";
import { PromptPanel } from "@/components/home/PromptPanel";
import { HeroSection } from "@/components/home/HeroSection";
import { Footer } from "@/components/home/Footer";
import TutorialModal from "./components/TutorialModal";
import track from "@/lib/track";
import { PromptItem } from "@/app/api/prompts/types";
import useMount from "@/hooks/useMount";

export default function HomePage() {
  const { containerRef, getCloudTransform } = useCloudAnimation(0);
  const router = useRouter();
  const { authenticated, ready } = usePrivy();
  const { setIsGuestUser } = useGuestUserStore();
  const [animationStarted, setAnimationStarted] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const promptFormRef = useRef<HTMLFormElement>(null);
  const [optimisticPrompts, setOptimisticPrompts] = useState<PromptItem[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const searchParams = useSearchParams();
  const utmSource = searchParams.get("utm_source");

  useMount(() => {
    track("home_page_viewed", {
      utm_source: utmSource,
    });
  });

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
  } = usePromptsApi();

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

  useEffect(() => {
    setIsMounted(true);

    // Check if device is mobile
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        const rect = mainContent.getBoundingClientRect();
        setShowFooter(rect.top <= 56);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [containerRef]);

  const handlePromptSubmit = getHandleSubmit(async value => {
    const sessionId = "optimistic-" + Date.now();
    const optimisticPrompt: PromptItem = {
      text: value,
      seed: userAvatarSeed || "optimistic",
      isUser: true,
      timestamp: Date.now(),
      sessionId,
    };
    setOptimisticPrompts(prev => [...prev, optimisticPrompt]);
    await addToPromptQueue(value, userAvatarSeed, true);
    setOptimisticPrompts(prev => prev.filter(p => p.sessionId !== sessionId));

    track("daydream_landing_page_prompt_submitted", {
      is_authenticated: authenticated,
      prompt: value,
    });
  });

  const handleButtonClick = () => {
    redirectToCreate();
  };

  const submitPromptForm = () => {
    promptFormRef.current?.requestSubmit();
  };

  if (!ready || loading) {
    return <div className="flex items-center justify-center h-screen"></div>;
  }

  if (!promptState) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading prompt state...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] w-screen h-screen overflow-hidden">
      <div
        ref={containerRef}
        className="w-full h-full flex flex-col justify-start relative overflow-y-auto scrollbar-gutter-stable"
      >
        <CloudBackground
          animationStarted={animationStarted}
          getCloudTransform={getCloudTransform}
        />

        <div
          className={`z-10 w-full p-0 md:px-4 md:pt-0 flex flex-col transition-all duration-1000 ease-in-out ${
            showContent ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
          }`}
        >
          <HeroSection
            handlePromptSubmit={handlePromptSubmit}
            promptValue={prompt}
            setPromptValue={setPrompt}
            submitPromptForm={submitPromptForm}
            isAuthenticated={authenticated}
          />
          <div
            id="main-content"
            className={`relative flex flex-col md:flex-row gap-0 md:gap-8 w-full overflow-hidden pb-14 md:px-8 ${isMobile ? "h-[100dvh] bg-black" : ""}`}
            style={{ height: isMobile ? "100vh" : "100vh" }}
          >
            <VideoSection
              isMobile={isMobile}
              onTryCameraClick={handleButtonClick}
              buttonText={authenticated ? "Create" : "Use your camera"}
            />

            <PromptPanel
              promptQueue={[...optimisticPrompts, ...promptState.promptQueue]}
              displayedPrompts={promptState.displayedPrompts}
              promptAvatarSeeds={promptState.promptAvatarSeeds}
              userPromptIndices={promptState.userPromptIndices}
              onSubmit={handlePromptSubmit}
              promptValue={prompt}
              onPromptChange={handlePromptChange}
              setPromptValue={setPrompt}
              isThrottled={isThrottled}
              throttleTimeLeft={throttleTimeLeft}
              onTryCameraClick={handleButtonClick}
              buttonText={authenticated ? "Create" : "Use your camera"}
              isAuthenticated={authenticated}
              promptFormRef={promptFormRef}
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      <div
        style={{ width: "calc(100vw - 15px)" }}
        className="hidden md:block fixed bottom-0 left-0 z-20"
      >
        <Footer showFooter={true} />
      </div>

      <div className="md:hidden fixed bottom-0 left-0 w-full z-20">
        <Footer showFooter={true} isMobile={true} />
      </div>

      <TutorialModal
        isOpen={isTutorialModalOpen}
        onClose={() => setIsTutorialModalOpen(false)}
      />
    </div>
  );
}
