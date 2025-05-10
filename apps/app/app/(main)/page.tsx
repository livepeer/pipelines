"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePrivy } from "@/hooks/usePrivy";
import { useGuestUserStore } from "@/hooks/useGuestUser";
import useCloudAnimation from "@/hooks/useCloudAnimation";
import { usePromptQueue } from "@/hooks/usePromptQueue";
import { useThrottledInput } from "@/hooks/useThrottledInput";
import { useRandomPromptTimer } from "@/hooks/useRandomPromptTimer";
import { CloudBackground } from "@/components/home/CloudBackground";
import { VideoSection } from "@/components/home/VideoSection";
import { PromptPanel } from "@/components/home/PromptPanel";
import { HomePageStyles } from "@/components/home/HomePageStyles";
import TutorialModal from "./components/TutorialModal";

// Prompt mock data
const initialPrompts = [
  "cyberpunk cityscape with neon lights --quality 3",
  "underwater scene with ((bioluminescent)) creatures --creativity 0.8",
  "forest with magical creatures and (((glowing plants))) --quality 2",
  "cosmic nebula with vibrant colors --creativity 0.7",
  "futuristic landscape with floating islands --quality 3",
  "dreamy pastel colored clouds at sunset --creativity 0.5",
  "abstract ((geometric patterns)) with vibrant colors --quality 2",
  "retro pixel art style mountain landscape --creativity 0.9",
  "steampunk mechanical creatures in motion --quality 2 --creativity 0.6",
  "surreal desert with floating objects --quality 1",
  "minimalist Japanese garden with koi pond --creativity 0.4",
  "synthwave sunset over a digital grid city --quality 3",
  "watercolor style city in the rain --creativity 0.7",
  "low poly forest with mystical elements --quality 2",
  "art deco style portrait with gold accents --creativity 0.6",
  "(((cybernetic samurai))) in futuristic tokyo --quality 3",
  "fantasy castle among the clouds --creativity 0.8",
  "ancient ruins overgrown with ((vines)) --quality 2",
  "jellyfish in deep ocean scene with light rays --creativity 0.7",
  "medieval village with fantasy elements --quality 2",
  "sci-fi space station interior --creativity 0.9 --quality 3",
  "((autumn forest)) at sunrise with mist --quality 2",
  "minimalist geometric landscape --creativity 0.5",
  "nighttime cityscape with rain reflections --quality 3",
  "psychedelic fractal patterns --creativity 0.9",
  "detailed macrophotography of insects --quality 3",
  "vintage anime style character portrait --creativity 0.8",
  "underwater city with ((bioluminescent)) architecture --quality 2 --creativity 0.7",
  "gothic cathedral interior with sunbeams --quality 3",
  "((post-apocalyptic)) landscape with abandoned buildings --creativity 0.6",
];

const otherPeoplePrompts = [
  "hyperrealistic portrait of an alien queen --quality 3",
  "fantasy castle floating among clouds at sunset --creativity 0.8",
  "cybernetic ((animal)) with glowing parts --quality 2",
  "dreamlike surreal landscape with impossible physics --creativity 0.9",
  "ancient ruins overgrown with (((luminescent plants))) --quality 3",
  "underwater city with bioluminescent architecture --creativity 0.7",
  "samurai in a ((cherry blossom)) storm --quality 2",
  "psychedelic mandala with fractal patterns --creativity 0.8",
  "synthwave city with holographic billboards --quality 3",
  "dystopian cityscape with heavy industrial elements --creativity 0.6",
  "crystal cave with glowing minerals --quality 2",
  "aurora borealis over a mountain lake --creativity 0.5",
  "fantastical creatures in a magical forest --quality 3",
  "abstract digital glitch art with vibrant colors --creativity 0.9",
  "victorian steampunk laboratory with gadgets --quality 3",
  "cosmic horror scene with tentacled entity --creativity 0.8 --quality 3",
  "((floating islands)) in the sky with waterfalls --quality 2",
  "portrait in the style of ((Alphonse Mucha)) --creativity 0.7",
  "ancient Egyptian scene with mythological beings --quality 3",
  "neon-lit cyberpunk alleyway in the rain --creativity 0.8",
  "(((coral reef))) with tropical fish --quality 3",
  "futuristic cityscape at night --creativity 0.6",
  "magical library with floating books --quality 2",
  "studio ghibli style landscape --creativity 0.7",
  "gothic horror mansion interior --quality 3",
  "space nebula with planets and stars --creativity 0.9",
  "underwater temple ruins --quality 2",
  "art nouveau style ((female portrait)) --creativity 0.8",
  "fantasy tree house village --quality 3",
  "abandoned spaceship interior with plants --creativity 0.7",
  "flying steampunk airship with clouds --quality 2",
  "1980s retrofuturism cityscape --creativity 0.8",
  "glowing mushroom forest at night --quality 3 --creativity 0.9",
  "cyberpunk street market with neon signs --quality 2",
  "surrealist dreamscape with melting clocks --creativity 0.9",
];

export default function HomePage() {
  const { containerRef, getCloudTransform } = useCloudAnimation(0);
  const router = useRouter();
  const { authenticated, ready } = usePrivy();
  const { setIsGuestUser } = useGuestUserStore();
  const [animationStarted, setAnimationStarted] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Using our custom hooks
  const {
    value: prompt,
    setValue: setPrompt,
    handleChange: handlePromptChange,
    handleSubmit: getHandleSubmit,
    isThrottled,
    throttleTimeLeft,
  } = useThrottledInput();

  const {
    promptQueue,
    displayedPrompts,
    promptAvatarSeeds,
    userPromptIndices,
    userAvatarSeed,
    addToPromptQueue,
    addRandomPrompt,
  } = usePromptQueue({
    initialPrompts,
    otherPeoplePrompts,
    showContent,
  });

  useRandomPromptTimer({
    authenticated,
    ready,
    showContent,
    addRandomPrompt,
  });

  const redirectAsGuest = () => {
    setIsGuestUser(true);
    let b64Prompt = btoa(
      prompt ||
        "((cubism)) tesseract ((flat colors)) --creativity 0.6 --quality 3",
    );
    router.push(`/create?inputPrompt=${b64Prompt}`);
  };

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
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [authenticated, ready]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handlePromptSubmit = getHandleSubmit(value => {
    addToPromptQueue(value, userAvatarSeed, true);
  });

  const handleTryCameraClick = () => {
    redirectAsGuest();
  };

  if (!ready) {
    return <div className="flex items-center justify-center h-screen"></div>;
  }

  if (authenticated) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center w-screen h-screen overflow-hidden">
      <HomePageStyles />

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
              promptQueue={promptQueue}
              displayedPrompts={displayedPrompts}
              promptAvatarSeeds={promptAvatarSeeds}
              userPromptIndices={userPromptIndices}
              onSubmit={handlePromptSubmit}
              promptValue={prompt}
              onPromptChange={handlePromptChange}
              isThrottled={isThrottled}
              throttleTimeLeft={throttleTimeLeft}
              onTryCameraClick={handleTryCameraClick}
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
