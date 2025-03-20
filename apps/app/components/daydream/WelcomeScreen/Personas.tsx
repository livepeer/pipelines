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
    // TODO: Add analytics and push the personas to the database/form
    console.log("Selected personas:", selectedPersonas);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCurrentStep("camera");
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-[12px] w-full">
        {personas.map(persona => (
          <div key={persona} className="persona-button-wrapper">
            <button
              onClick={
                currentStep === "persona"
                  ? () => togglePersona(persona)
                  : undefined
              }
              className={`w-full sm:max-w-none h-[30px] px-[13px] flex justify-center items-center gap-1 text-[13px] font-normal font-inter rounded-full ${
                selectedPersonas.includes(persona)
                  ? "bg-[#95B4BE] text-[#010101] selected-persona"
                  : "bg-white text-[#232323] unselected-persona"
              }`}
            >
              <span>{persona}</span>
              {selectedPersonas.includes(persona) ? (
                <CheckIcon className="w-4 h-4 stroke-[1.67px]" />
              ) : (
                <PlusIcon className="w-4 h-4 stroke-[1.67px]" />
              )}
            </button>
          </div>
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
