"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Camera,
  Wand2,
  Video,
  ArrowRight,
  XCircle,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStreamStatus } from "@/hooks/useStreamStatus";

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
}

const Interstitial: React.FC<InterstitialProps> = ({
  onReady = () => {},
  onCameraPermissionGranted = useCallback(() => {}, []),
  outputPlaybackId,
  streamId,
  onPromptApply,
}) => {
  const [cameraPermission, setCameraPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [currentScreen, setCurrentScreen] = useState<"camera" | "prompts">("camera");
  const [redirected, setRedirected] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasScheduledRedirect = useRef(false);

  const effectiveStreamId = streamId || "";
  const { status: streamStatus, loading: statusLoading, error: statusError } = useStreamStatus(effectiveStreamId, false);

  useEffect(() => {
    if (streamId) {
      console.log("[Interstitial] streamId provided:", streamId);
    } else {
      console.log("[Interstitial] No streamId provided");
    }
  }, [streamId]);

  useEffect(() => {
    console.log("[Interstitial] useStreamStatus update:", { streamStatus, statusLoading, statusError });
  }, [streamStatus, statusLoading, statusError]);

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
        !hasScheduledRedirect.current) {
      console.log("[Interstitial] Stream status is ONLINE, waiting 30 seconds before redirect");
      hasScheduledRedirect.current = true;
      redirectTimerRef.current = setTimeout(() => {
        if (selectedPrompt && onPromptApply) {
          console.log("[Interstitial] Applying selected prompt:", selectedPrompt);
          onPromptApply(selectedPrompt);
        }
        setRedirected(true);
        onReady();
      }, 30000);
    }
  }, [streamStatus, redirected, selectedPrompt, onPromptApply, onReady]);

  useEffect(() => {
    if (currentScreen === "prompts") {
      const busyTimeout = setTimeout(() => {
        console.log("[Interstitial] Busy timeout reached (45 sec).");
        setBusy(true);
      }, 45000);
      const finalTimeout = setTimeout(() => {
        console.log("[Interstitial] Final timeout reached (180 sec).");
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
      ? "Our services are busy, please hold on. Your stream is still being prepared."
      : "We are preparing your experience. This may take up to 45 seconds. You will be automatically redirected when the stream is ready.";
  };

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
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Livepeer Pipelines</h1>
              <p className="text-muted-foreground">
                Transform your content in real-time using AI
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center space-y-2 p-4 rounded-lg border bg-card cursor-default">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
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
              <Button variant="ghost" onClick={() => setCurrentScreen("prompts")}>
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
                <ExamplePromptComponent
                  key={i}
                  example={example}
                  selected={selectedPrompt === example.prompt}
                  onSelect={() => {
                    console.log("[Interstitial] Selected prompt:", example.prompt);
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
                      ? "Our services are busy, please hold on. Your stream is still being prepared."
                      : "We are preparing your experience. This may take up to 45 seconds. You will be automatically redirected when the stream is ready."}
                  </p>
                  {streamId && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {getStatusMessage()}
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
