"use client";

import { useRouter } from "next/navigation";
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
import { TrackedButton } from "@/components/analytics/TrackedButton";
import { SquareDashedBottomCode, Workflow } from "lucide-react";
import { PromptItem } from "@/app/api/prompts/types";

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
    await addToPromptQueue(value, userAvatarSeed, true, sessionId);
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center w-screen h-screen overflow-hidden">
      <div
        ref={containerRef}
        className="w-full h-full flex flex-col items-center justify-start pt-4 relative overflow-y-auto"
      >
        <CloudBackground
          animationStarted={animationStarted}
          getCloudTransform={getCloudTransform}
        />

        <div
          className={`z-10 w-full md:max-w-[95%] mx-auto p-0 md:px-4 md:pt-0 pb-12 md:pb-4 flex flex-col gap-2 md:gap-4 transition-all duration-1000 ease-in-out ${
            showContent ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
          }`}
        >
          <HeroSection
            handlePromptSubmit={handlePromptSubmit}
            promptValue={prompt}
            setPromptValue={setPrompt}
            submitPromptForm={submitPromptForm}
          />
          <div
            id="main-content"
            className="flex flex-col md:flex-row gap-0 md:gap-8 w-full overflow-hidden pb-14"
            style={{ height: "calc(100vh - 56px)" }}
          >
            <VideoSection />

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
              buttonText={authenticated ? "Create" : "Pick your own video"}
              isAuthenticated={authenticated}
              promptFormRef={promptFormRef}
            />
          </div>
        </div>
      </div>

      <div className="hidden md:block w-full">
        <Footer showFooter={true} />
      </div>
      <TutorialModal
        isOpen={isTutorialModalOpen}
        onClose={() => setIsTutorialModalOpen(false)}
      />
    </div>
  );
}
