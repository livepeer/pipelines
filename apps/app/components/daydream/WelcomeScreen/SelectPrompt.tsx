import Image from "next/image";
import { useOnboard } from "../OnboardContext";
import useScrollView from "@/hooks/useScrollView";
import { useEffect } from "react";
import track from "@/lib/track";
import { usePrivy } from "@privy-io/react-auth";
import useMount from "@/hooks/useMount";
import { Separator } from "@repo/design-system/components/ui/separator";
import { InfoIcon } from "lucide-react";

interface PromptOption {
  id: string;
  title: string;
  image: string;
  prompt: string;
}

const promptOptions: PromptOption[] = [
  {
    id: "starry-night",
    title: "Van Gogh's Starry Night",
    image: "/images/starry-night.png",
    prompt:
      "portrait in style of (Van Gogh) :: swirling starry night-inspired backdrop --quality 3",
  },
  {
    id: "synthwave",
    title: "SynthWave Aesthetic",
    image: "/images/synthwave.png",
    prompt:
      "(videogame neon 80s) sunglasses hoodie :: (((neon grid))) --quality 3",
  },
  {
    id: "superhero",
    title: "Comic book superhero",
    image: "/images/superhero.png",
    prompt: "me resembling (superman) :: skycrapers --quality 3",
  },
  {
    id: "cyberpunk",
    title: "Cyberpunk Neon City",
    image: "/images/cyberpunk.png",
    prompt:
      "Cyberpunk ((cyberware)) mohawk tattoo :: futuristic metropolis backdrop --quality 3",
  },
];

export default function SelectPrompt() {
  const {
    currentStep,
    setCurrentStep,
    selectedPrompt,
    setSelectedPrompt,
    setFadingOut,
  } = useOnboard();
  const componentRef = useScrollView(currentStep === "prompt");
  const { user } = usePrivy();

  useEffect(() => {
    if (currentStep === "prompt") {
      track("daydream_prompt_viewed", {
        user_id: user?.id,
      });
    }
  }, [currentStep, user?.id]);

  useEffect(() => {
    if (currentStep === "prompt" && selectedPrompt) {
      track("daydream_prompt_selected", {
        prompt: selectedPrompt,
        user_id: user?.id,
      });
    }
  }, [selectedPrompt, currentStep, user?.id]);

  if (currentStep !== "prompt") {
    return null;
  }

  const handleSelectPrompt = (prompt: string) => {
    setFadingOut(true);
    setSelectedPrompt(prompt);
    localStorage.setItem("daydream_onboarding_step", "main");
    // Wait for the fade out to complete before setting the current step to main
    setTimeout(() => {
      setCurrentStep("main");
      window && window.scrollTo({ top: 0, behavior: "instant" });
    }, 1000);
  };

  return (
    <>
      <Separator className="bg-[#D2D2D2]" />
      <div
        ref={componentRef}
        className="flex flex-col animate-fade-in py-16 pt-4 scroll-mb-24"
      >
        <div className="mb-12 text-start">
          <h1 className="font-playfair font-semibold text-[24px] leading-[1.2em] text-[#1C1C1C] mb-2">
            Pick a prompt for your first video
          </h1>
          <p className="font-opensans text-[14px] sm:text-[18px] leading-[1.55em] text-[#232323]">
            Select one of the options for your first prompt
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-12 w-full">
          {promptOptions.map(option => (
            <div
              key={option.id}
              className="cursor-pointer"
              onClick={() => handleSelectPrompt(option.prompt)}
            >
              <div className="relative group">
                <div className="relative w-full h-[131px] sm:h-[200px] rounded-[14px] overflow-hidden shadow-[4px_8px_12px_0px_rgba(9,28,20,0.77)]">
                  <Image
                    src={option.image}
                    alt={option.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute bottom-0 left-0 right-0 py-2 group-hover:py-4 bg-[rgba(28,28,28,0.25)] backdrop-blur-[24px] flex flex-col items-center justify-center gap-1 transition-all duration-300 ease-out">
                    <div className="flex items-center gap-2">
                      <p className="font-inter font-semibold text-[12px] sm:text-[14px] leading-[1em] tracking-[-1.1%] text-[#EDEDED] text-center">
                        {option.title}
                      </p>
                      <InfoIcon className="w-3 h-3 hidden sm:block text-[#EDEDED]" />
                    </div>
                    <p className="font-mono text-[8px] sm:text-[10px] leading-[1em] text-[#EDEDED] text-center h-0 group-hover:h-[2em] opacity-0 group-hover:opacity-75 overflow-hidden transition-all duration-300 ease-out px-2">
                      {option.prompt}
                    </p>
                  </div>
                </div>
                {selectedPrompt === option.prompt && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-[14px] pointer-events-none" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
