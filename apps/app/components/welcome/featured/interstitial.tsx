"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Camera,
  Wand2,
  Mic,
  ArrowRight,
  XCircle,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStreamStatus } from "@/hooks/useStreamStatus";
import { usePrivy } from "@privy-io/react-auth";
import LoggedOutComponent from "@/components/modals/logged-out";
import { TrialExpiredModal } from "@/components/modals/trial-expired-modal";
import InterstitialDecor from "./interstitial-decor";

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
    title: "Use your camera",
    description: "Grant camera access to begin the transformation",
  },
  {
    icon: Mic,
    title: "Use your microphone",
    description: "Enable audio for your stream",
  },
];

interface SlideProps {
  keyName: string;
  slideVariants: any;
  children: React.ReactNode;
  flipDirection?: boolean;
}

const Slide: React.FC<SlideProps> = ({ keyName, children, slideVariants }) => (
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

interface ExamplePromptComponentProps {
  example: ExamplePrompt;
  selected: boolean;
  onSelect: () => void;
}

const ExamplePromptComponent: React.FC<ExamplePromptComponentProps> = ({ example, selected, onSelect }) => (
  <div
    onClick={onSelect}
    onKeyDown={(e) => {
      if (e.key === "Enter") onSelect();
    }}
    tabIndex={0}
    className={`p-4 rounded-lg border bg-card cursor-pointer outline-none focus:ring-2 ${
      selected ? "border-blue-500" : "border-gray-300"
    }`}
  >
    <p className="font-medium">{example.prompt}</p>
    <p className="text-sm text-muted-foreground">{example.description}</p>
  </div>
);

interface InterstitialProps {
  onReady?: () => void;
  onCameraPermissionGranted?: () => void;
  outputPlaybackId?: string;
  streamId?: string;
  onPromptApply?: (prompt: string) => void;
  showLoginPrompt?: boolean;
}

type PermissionState = "prompt" | "granted" | "denied";

const Interstitial: React.FC<InterstitialProps> = ({
  onReady = () => {},
  onCameraPermissionGranted = useCallback(() => {}, []),
  outputPlaybackId,
  streamId,
  onPromptApply,
  showLoginPrompt = false,
}) => {
  const { authenticated, login } = usePrivy();
  const [cameraPermission, setCameraPermission] = useState<PermissionState>("prompt");
  const [currentScreen, setCurrentScreen] = useState<"camera" | "prompts">("camera");
  const [redirected, setRedirected] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasScheduledRedirect = useRef(false);
  const [micPermission, setMicPermission] = useState<PermissionState>("prompt");

  const effectiveStreamId = streamId || "";
  const { status: streamStatus, loading: statusLoading, error: statusError, fullResponse } = useStreamStatus(effectiveStreamId, false);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if ("permissions" in navigator) {
          const permissionStatus = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });
          if (permissionStatus.state === "denied") {
            setCameraPermission("denied");
          }
        }
      } catch (err) {
        console.error("Error checking camera permission:", err);
      }
    };
    
    checkPermissions();
  }, []);

  useEffect(() => {
    const triggerCamera = async () => {
      try {
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
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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

  useEffect(() => {
    if ((streamStatus === "ONLINE" || streamStatus === "DEGRADED_INFERENCE") &&
        !redirected &&
        !hasScheduledRedirect.current &&
        fullResponse?.inference_status?.fps > 0) {
      hasScheduledRedirect.current = true;
      if (selectedPrompt && onPromptApply) {
        onPromptApply(selectedPrompt);
      }
      redirectTimerRef.current = setTimeout(() => {
        setRedirected(true);
        onReady();
      }, 2000);
    }
  }, [streamStatus, redirected, selectedPrompt, onPromptApply, onReady, fullResponse]);

  useEffect(() => {
    if (currentScreen === "prompts") {
      const busyTimeout = setTimeout(() => {
        setBusy(true);
      }, 45000);
      const finalTimeout = setTimeout(() => {
        setTimedOut(true);
      }, 180000);
      return () => {
        clearTimeout(busyTimeout);
        clearTimeout(finalTimeout);
      };
    }
  }, [currentScreen]);

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

  const getStatusMessage = () => {
    if (statusLoading) {
      return streamStatus && streamStatus !== "OFFLINE"
        ? "Stream is now active and being processed. You will be automatically redirected in a moment."
        : "Stream is getting started, please wait...";
    }
    if (statusError) {
      return "Error retrieving status";
    }
    return busy
      ? "Almost there! Please hold on. Your stream is still being prepared."
      : "We are preparing your experience. This may take up to 45 seconds. You will be automatically redirected when the stream is ready.";
  };

  if (showLoginPrompt) {
    return (
      <TrialExpiredModal 
        open={true} 
        onOpenChange={(open) => {
          if (!open) {
            window.location.href = '/explore';
          }
        }} 
      />
    );
  }

  if (!streamId) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <AnimatePresence mode="wait" initial={false}>
        {currentScreen === "camera" ? (
          <Slide keyName="camera" slideVariants={slideVariants}>
            <div className="bg-[#161616] border border-[#232323] rounded-xl p-8 max-w-2xl w-full mx-auto shadow-lg">
              <div className="space-y-3 mb-8">
                <h1 className="text-2xl font-semibold">Start by granting Livepeer Permissions</h1>
                <p className="text-muted-foreground">
                  Before we start there are some permissions you need to give livepeer
                </p>
              </div>
              <div className="flex flex-col gap-4">
                {steps.map((step, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-6 py-12 px-6 rounded-lg border border-[#2e2e2e] bg-[#1c1c1c] relative overflow-hidden"
                  >
                    <step.icon className="h-6 w-6 text-[#00eb88] shrink-0" />
                    <div className="flex flex-col relative z-10">
                      <h3 className="text-lg font-bold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    <InterstitialDecor flip={i === 1} opacity={0.2} />
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center gap-4 mt-8">
                {cameraPermission === "prompt" && (
                  <Button 
                    onClick={requestCamera} 
                    size="lg" 
                    className="w-full rounded-full h-12 text-base"
                    disabled={cameraPermission === "prompt" || micPermission === "prompt"}
                  >
                    Continue
                  </Button>
                )}
                {cameraPermission === "denied" && (
                  <div className="text-destructive flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Camera access denied. Please enable in browser settings.
                  </div>
                )}
              </div>
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
                <ExamplePromptComponent
                  key={i}
                  example={example}
                  selected={selectedPrompt === example.prompt}
                  onSelect={() => {
                    setSelectedPrompt(example.prompt);
                  }}
                />
              ))}
            </div>
            <div className="mt-4">
              <div className="flex justify-start">
                <Button variant="ghost" onClick={handleBack} className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>
              {timedOut ? (
                <div className="mt-4 flex flex-col items-center">
                  <div className="text-sm text-destructive mb-2">
                    Something went wrong or we are currently at full capacity.
                  </div>
                  <Button variant="default" onClick={() => { window.location.href = "/explore"; }}>
                    Watch a Demo video
                  </Button>
                </div>
              ) : (
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {busy
                      ? "Almost there! Please hold on. Your stream is still being prepared."
                      : "We are preparing your experience. This may take up to 45 seconds. You will be automatically redirected when the stream is ready."}
                  </p>
                  {streamId && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {statusLoading 
                        ? (streamStatus && streamStatus !== "OFFLINE"
                            ? "Stream is now active and being processed. You will be automatically redirected in a moment."
                            : "Stream is getting started, please wait...")
                        : statusError
                        ? "Error retrieving status"
                        : null}
                    </div>
                  )}
                  <div className="mt-4 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </Slide>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Interstitial;
