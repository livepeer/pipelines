"use client";

import useCloudAnimation from "@/hooks/useCloudAnimation";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { usePrivy } from "@/hooks/usePrivy";
import { useGuestUserStore } from "@/hooks/useGuestUser";
import { Input } from "@repo/design-system/components/ui/input";
import { Button } from "@repo/design-system/components/ui/button";
import { Camera, Play, ArrowLeft, ArrowUp } from "lucide-react";
import TutorialModal from "./components/TutorialModal";
import { GradientAvatar } from "@/components/GradientAvatar";

export default function HomePage() {
  const { containerRef, getCloudTransform } = useCloudAnimation(0);
  const router = useRouter();
  const { authenticated, ready } = usePrivy();
  const { setIsGuestUser } = useGuestUserStore();
  const [animationStarted, setAnimationStarted] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [lastPromptTime, setLastPromptTime] = useState(0);
  const [isThrottled, setIsThrottled] = useState(false);
  const [throttleTimeLeft, setThrottleTimeLeft] = useState(0);

  const initialPrompts = [
    "cyberpunk cityscape with neon lights",
    "underwater scene with bioluminescent creatures",
    "forest with magical creatures and glowing plants",
    "cosmic nebula with vibrant colors",
    "futuristic landscape with floating islands",
    "dreamy pastel colored clouds at sunset",
    "abstract geometric patterns with vibrant colors",
    "retro pixel art style mountain landscape",
    "steampunk mechanical creatures in motion",
    "surreal desert with floating objects",
    "minimalist Japanese garden with koi pond",
    "synthwave sunset over a digital grid city",
    "watercolor style city in the rain",
    "low poly forest with mystical elements",
    "art deco style portrait with gold accents",
  ];

  const otherPeoplePrompts = [
    "hyperrealistic portrait of an alien queen",
    "fantasy castle floating among clouds at sunset",
    "cybernetic animal with glowing parts",
    "dreamlike surreal landscape with impossible physics",
    "ancient ruins overgrown with luminescent plants",
    "underwater city with bioluminescent architecture",
    "samurai in a cherry blossom storm",
    "psychedelic mandala with fractal patterns",
    "synthwave city with holographic billboards",
    "dystopian cityscape with heavy industrial elements",
    "crystal cave with glowing minerals",
    "aurora borealis over a mountain lake",
    "fantastical creatures in a magical forest",
    "abstract digital glitch art with vivid colors",
    "victorian steampunk laboratory with gadgets",
  ];

  const [displayedPrompts, setDisplayedPrompts] = useState(initialPrompts);
  const [promptAvatarSeeds, setPromptAvatarSeeds] = useState<string[]>(
    initialPrompts.map(
      (_, i) => `user-${i}-${Math.random().toString(36).substring(2, 8)}`,
    ),
  );
  const [userAvatarSeed] = useState(
    `user-${Math.random().toString(36).substring(2, 10)}`,
  );
  const [userPromptIndices, setUserPromptIndices] = useState<boolean[]>(
    initialPrompts.map(() => false),
  );

  const addRandomPrompt = useCallback(() => {
    if (!showContent) return;

    const randomIndex = Math.floor(Math.random() * otherPeoplePrompts.length);
    const randomPrompt = otherPeoplePrompts[randomIndex];
    const randomSeed = `user-${Math.random().toString(36).substring(2, 8)}`;

    setDisplayedPrompts(prevPrompts => [
      randomPrompt,
      ...prevPrompts.slice(0, prevPrompts.length - 1),
    ]);

    setPromptAvatarSeeds(prevSeeds => [
      randomSeed,
      ...prevSeeds.slice(0, prevSeeds.length - 1),
    ]);

    setUserPromptIndices(prevIndices => [
      false,
      ...prevIndices.slice(0, prevIndices.length - 1),
    ]);
  }, [otherPeoplePrompts, showContent]);

  useEffect(() => {
    if (!authenticated && ready && showContent) {
      const getRandomInterval = () => Math.floor(Math.random() * 2000) + 1500;

      let timerId: NodeJS.Timeout;

      timerId = setTimeout(function addPrompt() {
        addRandomPrompt();
        timerId = setTimeout(addPrompt, getRandomInterval());
      }, getRandomInterval());

      return () => clearTimeout(timerId);
    }
  }, [authenticated, ready, showContent, addRandomPrompt]);

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

  if (!ready) {
    return <div className="flex items-center justify-center h-screen"></div>;
  }

  if (authenticated) {
    return null;
  }

  const handleTryCameraClick = () => {
    redirectAsGuest();
  };

  const handlePromptSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!prompt.trim()) return;

    const now = Date.now();
    const timeElapsed = now - lastPromptTime;
    const cooldownPeriod = 5000; // 5 seconds cooldown

    if (timeElapsed < cooldownPeriod && lastPromptTime !== 0) {
      setIsThrottled(true);
      setThrottleTimeLeft(Math.ceil((cooldownPeriod - timeElapsed) / 1000));

      const countdownInterval = setInterval(() => {
        setThrottleTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(countdownInterval);
            setIsThrottled(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return;
    }

    const newPrompts = [
      prompt,
      ...displayedPrompts.slice(0, displayedPrompts.length - 1),
    ];
    setDisplayedPrompts(newPrompts);

    setPromptAvatarSeeds(prevSeeds => [
      userAvatarSeed,
      ...prevSeeds.slice(0, prevSeeds.length - 1),
    ]);

    setUserPromptIndices(prevIndices => [
      true,
      ...prevIndices.slice(0, prevIndices.length - 1),
    ]);

    setPrompt("");
    setLastPromptTime(now);

    // Simulating the interaction only
    // redirectAsGuest();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>

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
          className={`z-10 w-full max-w-[98%] md:max-w-[90%] mx-auto px-2 md:px-4 flex flex-col gap-4 md:gap-8 transition-all duration-1000 ease-in-out ${
            showContent ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
          }`}
          style={{ height: "calc(100vh - 80px)", marginTop: "0" }}
        >
          <h1
            className="text-3xl font-bold tracking-widest italic md:hidden mx-auto"
            style={{ color: "rgb(255, 255, 255)" }}
          >
            DAYDREAM
          </h1>
          <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-8 h-full overflow-auto">
            <div className="w-full md:w-[70%] relative rounded-lg overflow-hidden bg-black/10 backdrop-blur-sm shadow-lg aspect-video">
              <div className="absolute top-6 left-6 z-20 hidden md:block">
                <h1
                  className="text-4xl md:text-[120px] font-bold tracking-widest italic mix-blend-difference"
                  style={{ color: "rgb(255, 255, 255)" }}
                >
                  DAYDREAM
                </h1>
              </div>

              <div className="w-full h-full relative">
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  playsInline
                  loop
                  muted
                  autoPlay
                  controls={false}
                >
                  <source src="/placeholder.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            <div className="w-full md:w-[30%] flex flex-col bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
              <form
                onSubmit={handlePromptSubmit}
                className="p-4 border-b border-gray-200/30"
              >
                <div className="relative">
                  <Input
                    type="text"
                    placeholder={
                      isThrottled
                        ? `Wait ${throttleTimeLeft}s...`
                        : "Apply your prompt in real time.."
                    }
                    className={`w-full bg-white/50 rounded-lg border-none focus:ring-0 focus:border-none focus:outline-none ${isThrottled ? "opacity-50" : ""}`}
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    disabled={isThrottled}
                  />
                </div>
              </form>

              <div className="flex-1 max-h-[25vh] md:max-h-none p-4 flex flex-col justify-start overflow-hidden">
                <div className="space-y-0.5">
                  {displayedPrompts.map((prevPrompt, index) => {
                    const opacityReduction = userPromptIndices[index]
                      ? 0.04
                      : 0.08;
                    const itemOpacity =
                      index === 0
                        ? 1
                        : Math.max(0.4, 1 - index * opacityReduction);
                    const isUserPrompt = userPromptIndices[index];

                    return (
                      <div
                        key={`prompt-${index}-${prevPrompt.substring(0, 10)}`}
                        className={`p-2 rounded-lg text-sm md:text-base ${
                          index === 0
                            ? "text-black font-normal flex items-center animate-fadeSlideIn"
                            : `text-gray-500 italic flex items-center ${isUserPrompt ? "font-medium" : ""}`
                        } ${isUserPrompt && index !== 0 ? "relative overflow-hidden" : ""}`}
                        style={{
                          opacity: itemOpacity,
                          transition: "all 0.3s ease-out",
                          transform: `translateY(0)`,
                          animation:
                            index === 0
                              ? "fadeSlideIn 0.3s ease-out"
                              : `slideDown 0.3s ease-out`,
                        }}
                      >
                        {isUserPrompt && index !== 0 && (
                          <div
                            className="absolute inset-0 -z-10 bg-black/5 backdrop-blur-[1px] rounded-lg"
                            style={{ opacity: Math.min(1, itemOpacity + 0.2) }}
                          ></div>
                        )}
                        {index === 0 ? (
                          <>
                            <ArrowLeft className="hidden md:inline h-3 w-3 mr-2 stroke-2" />
                            <ArrowUp className="md:hidden h-3 w-3 mr-2 stroke-2" />
                          </>
                        ) : (
                          <div
                            className="mr-2"
                            style={{ opacity: itemOpacity }}
                          >
                            <GradientAvatar
                              seed={promptAvatarSeeds[index]}
                              size={16}
                            />
                          </div>
                        )}
                        {prevPrompt}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 border-t border-gray-200/30 flex flex-row gap-3 w-full">
                <Button
                  className="flex-1 px-4 py-2 h-10 rounded-md bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2"
                  onClick={handleTryCameraClick}
                >
                  <Camera className="hidden md:inline h-4 w-4" />
                  Try it with your camera
                </Button>
                <Button
                  onClick={() => setIsTutorialModalOpen(true)}
                  className="w-24 md:flex-1 px-4 py-2 h-10 rounded-md alwaysAnimatedButton text-black flex items-center justify-center gap-2"
                >
                  <Play className="hidden md:inline h-4 w-4 stroke-2 fill-none" />
                  Watch demo
                </Button>
              </div>
            </div>
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
