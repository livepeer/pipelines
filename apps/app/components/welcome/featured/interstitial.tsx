"use client";

import { useState, useEffect, useCallback } from "react";
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
import track from "@/lib/track";
interface ExamplePrompt {
  prompt: string;
  image: string;
}

interface Step {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}

export const examplePrompts: ExamplePrompt[] = [
  {
    prompt: "Van Gogh's Starry Night",
    image: "/images/vangogh.png"
  },
  {
    prompt: "Cyberpunk neon city",
    image: "/images/cyberpunk.png"
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
    description: "We check for microphone access in the background.",
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
  const [micPermission, setMicPermission] = useState<PermissionState>("prompt");
  const [permissionsChecked, setPermissionsChecked] = useState<boolean>(false);
  const [autoProceeded, setAutoProceeded] = useState<boolean>(false);
  const [initialCameraGranted, setInitialCameraGranted] = useState<boolean | null>(null);
  const [currentScreen, setCurrentScreen] = useState<"camera" | "prompts">("camera");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const effectiveStreamId = streamId || "";
  const { status: streamStatus, loading: statusLoading, error: statusError, fullResponse } = useStreamStatus(effectiveStreamId, false);

  useEffect(() => {
    const checkCamera = async () => {
      try {
        if ("permissions" in navigator) {
          const permissionStatus = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });
          const state = permissionStatus.state as PermissionState;
          setCameraPermission(state);
          if (state === "granted") {
            setInitialCameraGranted(true);
            onCameraPermissionGranted();
          } else {
            setInitialCameraGranted(false);
          }
        } else {
          setCameraPermission("prompt");
          setInitialCameraGranted(false);
        }
      } catch (err) {
        console.error("Error checking camera permission:", err);
        setInitialCameraGranted(false);
      } finally {
        setPermissionsChecked(true);
      }
    };

    checkCamera();
  }, [onCameraPermissionGranted]);

  useEffect(() => {
    const checkMic = async () => {
      try {
        if ("permissions" in navigator) {
          const permissionStatus = await navigator.permissions.query({
            name: "microphone" as PermissionName,
          });
          if (permissionStatus.state === "granted") {
            setMicPermission("granted");
            track("daydream_microphone_permission_granted", {
              is_authenticated: authenticated
            });
            return;
          } else if (permissionStatus.state === "denied") {
            setMicPermission("denied");
            track("daydream_microphone_permission_denied", {
              is_authenticated: authenticated
            });
            return;
          }
        }
        if (micPermission !== "granted") {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
          setMicPermission("granted");
        }
      } catch (err) {
        setMicPermission("prompt");
      }
    };

    checkMic();
  }, []);

  useEffect(() => {
    if (permissionsChecked && cameraPermission === "granted" && initialCameraGranted && !autoProceeded) {
      setAutoProceeded(true);
      onReady();
    }
  }, [permissionsChecked, cameraPermission, autoProceeded, onReady, initialCameraGranted]);

  const requestCamera = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const constraints = isMobile
      ? { video: { facingMode: "user" } }
      : {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach((track) => track.stop());

      setCameraPermission("granted");
      track("daydream_camera_permission_granted", {
        is_authenticated: authenticated
      });
      setCurrentScreen("prompts");
      onCameraPermissionGranted();
      setCurrentScreen("prompts");
    } catch (err) {
      console.error("Camera permission denied:", err);
      if ("permissions" in navigator) {
        const permissionStatus = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        if (permissionStatus.state === "denied") {
          setCameraPermission("denied");
          track("daydream_camera_permission_denied", {
            is_authenticated: authenticated
          });
        }
      } else {
        setCameraPermission("denied");
      }
    }
  };

  const handleBack = () => setCurrentScreen("camera");

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

  const TermsNotice = () => (
    <p className="text-xs text-muted-foreground text-center mt-4">
      By using this service, you accept the{" "}
      <a href="/terms" className="underline hover:text-primary">Terms of Service</a>{" "}
      and{" "}
      <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a>
    </p>
  );

  if (showLoginPrompt) {
    track("trial_expired_modal_shown", {
      is_authenticated: authenticated
    });
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

  if (permissionsChecked && cameraPermission === "granted" && initialCameraGranted) {
    return null;
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
                    <div className="hidden md:block">
                      <InterstitialDecor flip={i === 1} opacity={0.2} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center gap-4 mt-8">
                {(cameraPermission === "prompt" || cameraPermission === "granted") && (
                  <Button 
                    onClick={() => {
                      track("interstitial_continue_clicked", {
                        is_authenticated: authenticated,
                        camera_permission: cameraPermission,
                        mic_permission: micPermission
                      });
                      requestCamera();
                    }} 
                    size="lg" 
                    className="w-full rounded-full h-12 text-base active:opacity-70"
                    disabled={false}
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
                <TermsNotice />
              </div>
            </div>
          </Slide>
        ) : (
          <Slide keyName="prompts" slideVariants={slideVariants} flipDirection>
            <div className="bg-[#161616] border border-[#232323] rounded-xl p-8 max-w-2xl w-full mx-auto shadow-lg">
              <div className="space-y-3 mb-8">
                <h1 className="text-2xl font-semibold">Select your first prompt</h1>
                <p className="text-muted-foreground">
                  The same way you would with AI image generators like Midjourney, Dalle, or StableDiffusion.
                  <br />
                  <span className="hidden md:inline">
                    To get most out of Livepeer remember about a good lightning and a stable background.
                  </span>
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {examplePrompts.map((example, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedPrompt(example.prompt)}
                    className={`
                      relative h-48 md:h-64 rounded-xl overflow-hidden cursor-pointer
                      ${selectedPrompt === example.prompt ? 'ring-2 ring-[#00eb88]' : 'border border-[#2e2e2e]'}
                      ${selectedPrompt && selectedPrompt !== example.prompt ? 'opacity-25' : ''}
                    `}
                    style={{
                      backgroundImage: `url(${example.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute bottom-0 w-full p-4 bg-black/50 backdrop-blur-md rounded-t-xl">
                      <p className="text-white font-bold text-center">{example.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mt-8">
                <Button
                  onClick={() => {
                    if (selectedPrompt && onPromptApply) {
                      track("prompt_selected_continue", {
                        is_authenticated: authenticated,
                        selected_prompt: selectedPrompt
                      });
                      onPromptApply(selectedPrompt);
                    }
                    onReady();
                  }}
                  disabled={!selectedPrompt}
                  size="lg"
                  className="rounded-full h-12 flex-1"
                >
                  Continue
                </Button>
              </div>
              <TermsNotice />
            </div>
          </Slide>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Interstitial;
