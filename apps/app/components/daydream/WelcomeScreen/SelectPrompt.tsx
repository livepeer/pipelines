import Image from "next/image";
import { useOnboard } from "../OnboardContext";
import useScrollView from "@/hooks/useScrollView";

interface PromptOption {
  id: string;
  title: string;
  image: string;
}

const promptOptions: PromptOption[] = [
  {
    id: "starry-night",
    title: "Van Gogh's Starry Night",
    image: "/images/starry-night.png",
  },
  {
    id: "synthwave",
    title: "SynthWave Aesthetic",
    image: "/images/synthwave.png",
  },
  {
    id: "superhero",
    title: "Comic book superhero",
    image: "/images/superhero.png",
  },
  {
    id: "cyberpunk",
    title: "Cyberpunk Neon City",
    image: "/images/cyberpunk.png",
  },
];

export default function SelectPrompt() {
  const { currentStep, setCurrentStep, selectedPrompt, setSelectedPrompt } =
    useOnboard();
  const componentRef = useScrollView(currentStep === "prompt");

  if (currentStep !== "prompt") {
    return null;
  }

  const handleSelectPrompt = (prompt: string) => {
    setSelectedPrompt(prompt);
    setCurrentStep("main");
  };

  return (
    <div
      ref={componentRef}
      className="flex flex-col animate-fade-in py-16 scroll-mt-24 scroll-mb-24"
    >
      <div className="mb-12 text-start">
        <h1 className="font-playfair font-semibold text-[24px] leading-[1.2em] text-[#1C1C1C] mb-2">
          Experience preview
        </h1>
        <p className="font-opensans text-[14px] sm:text-[18px] leading-[1.55em] text-[#232323]">
          Select one of the options for your first prompt
        </p>
      </div>

      <div className="grid grid-cols-2 gap-[12px] w-full">
        {promptOptions.map(prompt => (
          <div
            key={prompt.id}
            className="cursor-pointer"
            onClick={() => handleSelectPrompt(prompt.title)}
          >
            <div className="relative group">
              <div className="relative w-full h-[200px] rounded-[14px] overflow-hidden shadow-[4px_8px_12px_0px_rgba(9,28,20,0.77)]">
                <Image
                  src={prompt.image}
                  alt={prompt.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute bottom-0 left-0 right-0 py-4 bg-[rgba(28,28,28,0.25)] backdrop-blur-[24px] flex items-center justify-center">
                  <p className="font-inter font-semibold text-[14px] leading-[1em] tracking-[-1.1%] text-[#EDEDED] text-center">
                    {prompt.title}
                  </p>
                </div>
              </div>
              {selectedPrompt === prompt.title && (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-[14px] pointer-events-none" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
