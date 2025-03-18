import { createContext, useContext, useState, useMemo, ReactNode } from "react";

// Define the possible onboarding steps
export type OnboardingStep = "persona" | "camera" | "prompt";

export type CameraPermission = "prompt" | "granted" | "denied";

interface OnboardContextType {
  // Current step in the onboarding flow
  currentStep: OnboardingStep;
  // Camera permission state
  cameraPermission: CameraPermission;
  // Selected options for each step
  selectedPersonas: string[] | null;
  selectedCamera: string | null;
  selectedPrompt: string | null;
  // Methods to update state
  setCurrentStep: (step: OnboardingStep) => void;
  setCameraPermission: (permission: CameraPermission) => void;
  setSelectedPersonas: (personas: string[]) => void;
  setSelectedCamera: (camera: string) => void;
  setSelectedPrompt: (prompt: string) => void;
}

// Create the context with a default undefined value
const OnboardContext = createContext<OnboardContextType | undefined>(undefined);

// Provider component
export function OnboardProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("persona");
  const [cameraPermission, setCameraPermission] =
    useState<CameraPermission>("prompt");
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      currentStep,
      cameraPermission,
      selectedPersonas,
      selectedCamera,
      selectedPrompt,
      setCurrentStep,
      setCameraPermission,
      setSelectedPersonas,
      setSelectedCamera,
      setSelectedPrompt,
    }),
    [
      currentStep,
      cameraPermission,
      selectedPersonas,
      selectedCamera,
      selectedPrompt,
    ],
  );

  return (
    <OnboardContext.Provider value={value}>{children}</OnboardContext.Provider>
  );
}

// Custom hook to use the onboard context
export function useOnboard() {
  const context = useContext(OnboardContext);
  if (context === undefined) {
    throw new Error("useOnboard must be used within an OnboardProvider");
  }
  return context;
}
