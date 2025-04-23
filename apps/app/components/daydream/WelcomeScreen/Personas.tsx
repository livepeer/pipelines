"use client";

import { updateUserAdditionalDetails } from "@/app/actions/user";
import { usePrivy } from "@/hooks/usePrivy";
import track from "@/lib/track";
import { Separator } from "@repo/design-system/components/ui/separator";
import { CheckIcon, PlusIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useOnboard } from "../OnboardContext";

const personas = [
  "Personal Use",
  "Content Creator",
  "Streamer",
  "AI Film Maker",
  "Performer",
  "Musician",
  "Engineer",
  "Other",
];

interface PersonasProps {
  simplified?: boolean;
}

export default function Personas({ simplified = false }: PersonasProps) {
  const { user } = usePrivy();
  const {
    currentStep,
    setCurrentStep,
    cameraPermission,
    selectedPersonas,
    setSelectedPersonas,
    customPersona,
    setCustomPersona,
  } = useOnboard();

  useEffect(() => {
    track("daydream_persona_viewed", {
      user_id: user?.id,
    });
  }, []);

  const togglePersona = (persona: string) => {
    if (persona !== "Other") {
      setCustomPersona("");
    }
    setSelectedPersonas(prev =>
      prev.includes(persona)
        ? prev.filter(p => p !== persona)
        : [...prev, persona],
    );
  };

  const handleContinue = async () => {
    track("daydream_personas_selected", {
      personas: selectedPersonas,
      custom_persona: customPersona,
      user_id: user?.id,
    });
    setCurrentStep(cameraPermission === "granted" ? "prompt" : "camera");
    await updateUserAdditionalDetails(user!, {
      next_onboarding_step: "camera",
      personas: selectedPersonas,
      custom_persona: customPersona,
    });
  };

  const isButtonDisabled =
    selectedPersonas.length === 0 ||
    (selectedPersonas.includes("Other") && !customPersona.trim());

  return (
    <>
      {currentStep === "persona" && (
        <div className="mt-6 md:mt-10 flex flex-col gap-6 md:gap-10 w-full max-w-xl mx-auto">
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
                      : "bg-white text-[#232323] animatedGradientButton"
                  }`}
                >
                  <span className="text-ellipsis overflow-hidden whitespace-nowrap flex-1 min-w-0">
                    {persona === "Other" &&
                    customPersona &&
                    selectedPersonas.includes("Other")
                      ? customPersona
                      : persona}
                  </span>
                  <div className="flex-shrink-0">
                    {selectedPersonas.includes(persona) ? (
                      <CheckIcon className="w-4 h-4 stroke-[1.67px]" />
                    ) : (
                      <PlusIcon className="w-4 h-4 stroke-[1.67px]" />
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>

          {selectedPersonas.includes("Other") && currentStep === "persona" && (
            <input
              type="text"
              value={customPersona}
              onChange={e => setCustomPersona(e.target.value)}
              placeholder="Tell us more about you!"
              className="w-full bg-[#F5F5F5] border border-[#DFDEDE] rounded-[24px] px-[16px] py-[16px] font-inter text-[13px] leading-[1.21] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#95B4BE] shadow-[8px_12px_24px_0px_rgba(13,19,30,0.15)]"
              required
            />
          )}

          {currentStep === "persona" && !simplified && (
            <div className="flex justify-end w-full">
              <button
                onClick={handleContinue}
                disabled={isButtonDisabled}
                className="bg-[#161616] disabled:bg-opacity-50 w-full sm:max-w-[187px] text-[#EDEDED] px-6 py-3 rounded-md font-inter font-semibold text-[15px] hover:bg-[#2D2D2D] disabled:hover:bg-[#161616] disabled:hover:bg-opacity-50 transition-colors"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
