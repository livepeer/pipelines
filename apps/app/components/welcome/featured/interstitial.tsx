"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Camera,
  Wand2,
  Video,
  ArrowRight,
  XCircle,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ExamplePrompt {
  prompt: string;
  description: string;
}

interface Step {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}

export const examplePrompts: ExamplePrompt[] = [
  {
    prompt: "Cyberpunk neon city",
    description: "Transform your feed into a futuristic neon-lit cityscape",
  },
  {
    prompt: "Van Gogh's Starry Night",
    description: "Apply the iconic painting style to your video",
  },
  {
    prompt: "Anime character style",
    description: "Convert your feed into an anime-inspired look",
  },
];

const steps: Step[] = [
  {
    icon: Camera,
    title: "Enable Camera",
    description: "Grant camera access to begin the transformation",
  },
  {
    icon: Wand2,
    title: "Enter Prompt",
    description: "Describe the style or effect you want to apply",
  },
  {
    icon: Video,
    title: "Real-time Transform",
    description: "Watch as AI transforms your video feed instantly",
  },
];

interface SlideProps {
  keyName: string;
  slideVariants: any; // You can define a more specific type if needed
  children: React.ReactNode;
  flipDirection?: boolean;
}

const Slide: React.FC<SlideProps> = ({
  keyName,
  children,
  slideVariants,
  flipDirection,
}) => (
  <motion.div
    key={keyName}
    initial="enter"
    animate="center"
    exit="exit"
    variants={slideVariants}
    transition={{ duration: 0.3 }}
    className="max-w-2xl w-full mx-auto p-6 space-y-8"
  >
    {children}
  </motion.div>
);

interface StepProps {
  step: Step;
}

const StepComponent: React.FC<StepProps> = ({ step }) => (
  <div className="flex flex-col items-center text-center space-y-2 p-4">
    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
      <step.icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="font-medium">{step.title}</h3>
    <p className="text-sm text-muted-foreground">{step.description}</p>
  </div>
);

interface ExamplePromptProps {
  example: ExamplePrompt;
}

const ExamplePromptComponent: React.FC<ExamplePromptProps> = ({ example }) => (
  <div className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors cursor-pointer">
    <p className="font-medium">{example.prompt}</p>
    <p className="text-sm text-muted-foreground">{example.description}</p>
  </div>
);

interface InterstitialProps {
  onReady?: () => void;
  onCameraPermissionGranted?: () => void;
}

const Interstitial: React.FC<InterstitialProps> = ({
  onReady = () => {},
  onCameraPermissionGranted = useCallback(() => {}, []),
}) => {
  const [cameraPermission, setCameraPermission] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");
  const [currentScreen, setCurrentScreen] = useState<"camera" | "prompts">(
    "camera"
  );

  useEffect(() => {
    const triggerCamera = async () => {
      try {
        // First check if we can query permissions
        if ("permissions" in navigator) {
          const permissionStatus = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });

          if (permissionStatus.state === "granted") {
            setCameraPermission("granted");
            setCurrentScreen("prompts");
            onCameraPermissionGranted();
            return;
          } else if (permissionStatus.state === "denied") {
            setCameraPermission("denied");
            return;
          }
        }

        // Fallback to getUserMedia if permissions API is not available
        // or if permission state is 'prompt'
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        stream.getTracks().forEach((track) => track.stop());
        setCameraPermission("granted");
        setCurrentScreen("prompts");
        onCameraPermissionGranted();
      } catch {
        setCameraPermission("prompt");
      }
    };
    triggerCamera();
  }, [onCameraPermissionGranted]);

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermission("granted");
      setCurrentScreen("prompts");
      onCameraPermissionGranted();
    } catch (err) {
      console.error("Camera permission denied:", err);
      setCameraPermission("denied");
    }
  };

  const handleBack = () => setCurrentScreen("camera");
  const handleGetStarted = () => onReady();
  const onSkip = () => setCurrentScreen("prompts");

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <AnimatePresence mode="wait" initial={false}>
        {currentScreen === "camera" ? (
          <Slide keyName="camera" slideVariants={slideVariants}>
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Livepeer Pipelines</h1>
              <p className="text-muted-foreground">
                Transform your content in real-time using AI
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((step, i) => (
                <StepComponent key={i} step={step} />
              ))}
            </div>
            <div className="flex flex-col items-center gap-4">
              {cameraPermission === "prompt" && (
                <Button onClick={requestCamera} size="lg" className="gap-2">
                  <Camera className="h-4 w-4" />
                  Enable Camera
                </Button>
              )}
              {cameraPermission === "denied" && (
                <div className="text-destructive flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Camera access denied. Please enable in browser settings.
                </div>
              )}
              <Button variant="ghost" onClick={onSkip}>
                Skip for now
              </Button>
            </div>
          </Slide>
        ) : (
          <Slide keyName="prompts" slideVariants={slideVariants} flipDirection>
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Get Inspired</h1>
              <p className="text-muted-foreground">
                Try these example prompts or create your own
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {examplePrompts.map((example, i) => (
                <ExamplePromptComponent key={i} example={example} />
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleBack} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleGetStarted} className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Slide>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Interstitial;
