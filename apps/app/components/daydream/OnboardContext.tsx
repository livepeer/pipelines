import { createContext, useContext, useState, useMemo, ReactNode } from "react";

// Define the possible onboarding steps
export type OnboardingStep = "persona" | "camera" | "prompt" | "main";

export type CameraPermission = "prompt" | "granted" | "denied";

interface OnboardContextType {
  // Current step in the onboarding flow
  currentStep: OnboardingStep;
  // Camera permission state
  initialCameraValidation: boolean;
  hasSharedPrompt: boolean;
  cameraPermission: CameraPermission;
  // Selected options for each step
  selectedPersonas: string[] | null;
  selectedPrompt: string | null;
  // When a prompt is selected, we fade out the welcome screen
  isFadingOut: boolean;
  // Methods to update state
  setCurrentStep: (step: OnboardingStep) => void;
  setCameraPermission: (permission: CameraPermission) => void;
  setSelectedPersonas: (personas: string[]) => void;
  setSelectedPrompt: (prompt: string | null) => void;
  setInitialCameraValidation: (validation: boolean) => void;
  setFadingOut: (fadingOut: boolean) => void;
}

// Create the context with a default undefined value
const OnboardContext = createContext<OnboardContextType | undefined>(undefined);

// Provider component
export function OnboardProvider({
  children,
  hasSharedPrompt,
}: {
  children: ReactNode;
  hasSharedPrompt: boolean;
}) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("persona");
  const [cameraPermission, setCameraPermission] =
    useState<CameraPermission>("prompt");
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [initialCameraValidation, setInitialCameraValidation] = useState(false);
  const [isFadingOut, setFadingOut] = useState(false);

  const value = useMemo(
    () => ({
      currentStep,
      cameraPermission,
      selectedPersonas,
      selectedPrompt,
      initialCameraValidation,
      isFadingOut,
      setCurrentStep,
      setCameraPermission,
      setSelectedPersonas,
      setSelectedPrompt,
      setInitialCameraValidation,
      setFadingOut,
      hasSharedPrompt,
    }),
    [
      currentStep,
      cameraPermission,
      selectedPersonas,
      selectedPrompt,
      initialCameraValidation,
      isFadingOut,
      hasSharedPrompt,
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
