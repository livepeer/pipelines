"use client";

import { Separator } from "@repo/design-system/components/ui/separator";
import { CheckIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useOnboard } from "../OnboardContext";

const personas = ["Streamer", "Content Creator", "Live Performer", "Other"];

export default function Personas() {
  const { currentStep, setCurrentStep } = useOnboard();
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);

  const togglePersona = (persona: string) => {
    setSelectedPersonas(prev =>
      prev.includes(persona)
        ? prev.filter(p => p !== persona)
        : [...prev, persona],
    );
  };

  const handleContinue = async () => {
    console.log("Selected personas:", selectedPersonas);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCurrentStep("camera");
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-[12px] w-full">
        {personas.map(persona => (
          <button
            key={persona}
            onClick={() => togglePersona(persona)}
            className={`w-full sm:max-w-none h-[30px] px-[13px] flex justify-center items-center gap-1 text-[13px] font-normal font-inter rounded-full border transition-colors ${
              selectedPersonas.includes(persona)
                ? "bg-[#95B4BE] text-[#010101] border-[#010101]"
                : "bg-white text-[#232323] border-[#83A5B5] hover:border-[#9A9A9A]"
            }`}
          >
            <span>{persona}</span>
            {selectedPersonas.includes(persona) ? (
              <CheckIcon className="w-4 h-4 stroke-[1.67px]" />
            ) : (
              <PlusIcon className="w-4 h-4 stroke-[1.67px]" />
            )}
          </button>
        ))}
      </div>
      <Separator className="bg-[#D2D2D2]" />
      {currentStep === "persona" && (
        <div className="flex justify-end w-full">
          <button
            onClick={handleContinue}
            disabled={selectedPersonas.length === 0}
            className="bg-[#161616] disabled:bg-opacity-50 w-full sm:max-w-[187px] text-[#EDEDED] px-6 py-3 rounded-md font-inter font-semibold text-[15px] hover:bg-[#2D2D2D] transition-colors"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
