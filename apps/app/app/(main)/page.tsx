"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePrivy } from "@/hooks/usePrivy";
import { useGuestUserStore } from "@/hooks/useGuestUser";
import useCloudAnimation from "@/hooks/useCloudAnimation";
import { usePromptsApi } from "@/hooks/usePromptsApi";
import { useThrottledInput } from "@/hooks/useThrottledInput";
import { useRandomPromptApiTimer } from "@/hooks/useRandomPromptApiTimer";
import { CloudBackground } from "@/components/home/CloudBackground";
import { VideoSection } from "@/components/home/VideoSection";
import { PromptPanel } from "@/components/home/PromptPanel";
import TutorialModal from "./components/TutorialModal";
import { track } from "mixpanel-browser";

export default function HomePage() {
  const { containerRef, getCloudTransform } = useCloudAnimation(0);
  const router = useRouter();
  const { authenticated, ready } = usePrivy();
  const { setIsGuestUser } = useGuestUserStore();
  const [animationStarted, setAnimationStarted] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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

  const handlePromptSubmit = getHandleSubmit(async value => {
    await addToPromptQueue(value, userAvatarSeed, true);

    track("daydream_landing_page_prompt_submitted", {
      is_authenticated: authenticated,
      prompt: value,
    });

  });

  const handleButtonClick = () => {
    redirectToCreate();
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
        className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      >
        <CloudBackground
          animationStarted={animationStarted}
          getCloudTransform={getCloudTransform}
        />

        <div
          className={`z-10 w-full h-screen md:h-[calc(100vh-80px)] md:max-w-[95%] mx-auto p-0 md:px-4 md:py-5 flex flex-col gap-4 md:gap-8 transition-all duration-1000 ease-in-out overflow-hidden md:overflow-visible ${
            showContent ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
          }`}
        >
          <h1
            className="text-3xl font-bold tracking-widest italic md:hidden mx-auto absolute top-4 z-30 w-full text-center"
            style={{ color: "rgb(255, 255, 255)" }}
          >
            DAYDREAM
          </h1>
          <div className="flex-1 flex flex-col md:flex-row gap-0 md:gap-8 h-full w-full overflow-hidden">
            <VideoSection />

            <PromptPanel
              promptQueue={promptState.promptQueue}
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
              buttonText={authenticated ? "Create" : "Try it with your camera"}
              isAuthenticated={authenticated}
            />
          </div>
        </div>
      </div>

      <TutorialModal
        isOpen={isTutorialModalOpen}
        onClose={() => setIsTutorialModalOpen(false)}
      />
    </div>
  );
}
