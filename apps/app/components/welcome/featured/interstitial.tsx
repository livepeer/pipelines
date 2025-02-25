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
    image: "/images/vangogh.png",
  },
  {
    prompt: "Cyberpunk neon city",
    image: "/images/cyberpunk.png",
  },
];

const steps: Step[] = [
  {
    icon: Camera,
    title: "Enable Camera",
    description: "Enable your camera to transform live video in real-time",
  },
  {
    icon: Mic,
    title: "Enable Microphone",
    description: "Enable your microphone to add sound to your stream",
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
  showPromptSelection?: boolean;
}

type PermissionState = "prompt" | "granted" | "denied";

const Interstitial: React.FC<InterstitialProps> = ({
  onReady = () => {},
  onCameraPermissionGranted = useCallback(() => {}, []),
  outputPlaybackId,
  streamId,
  onPromptApply,
  showLoginPrompt = false,
  showPromptSelection = false,
}) => {
  
  const { authenticated, login } = usePrivy();
  const [cameraPermission, setCameraPermission] =
    useState<PermissionState>("prompt");
  const [micPermission, setMicPermission] = useState<PermissionState>("prompt");
  const [permissionsChecked, setPermissionsChecked] = useState<boolean>(false);
  const [autoProceeded, setAutoProceeded] = useState<boolean>(false);
  const [initialCameraGranted, setInitialCameraGranted] = useState<
    boolean | null
  >(null);
  const [currentScreen, setCurrentScreen] = useState<"camera" | "prompts">(
    "camera",
  );
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [isPermissionLoading, setIsPermissionLoading] = useState(false);
  const [isPromptLoading, setIsPromptLoading] = useState(false);

  const setCameraPermissionWithLog = (value: PermissionState) => {
    setCameraPermission(value);
  };
  
  const setCurrentScreenWithLog = (value: "camera" | "prompts") => {
    setCurrentScreen(value);
  };
  
  const setInitialCameraGrantedWithLog = (value: boolean) => {
    setInitialCameraGranted(value);
  };

  const setAutoProceededWithLog = (value: boolean) => {
    setAutoProceeded(value);
  };
  
  const setPermissionsCheckedWithLog = (value: boolean) => {
    setPermissionsChecked(value);
  };

  const effectiveStreamId = streamId || "";
  const {
    status: streamStatus,
    loading: statusLoading,
    error: statusError,
    fullResponse,
  } = useStreamStatus(effectiveStreamId, false);

  useEffect(() => {
    const checkCamera = async () => {
      try {
        if ("permissions" in navigator) {
          const permissionStatus = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });
          const state = permissionStatus.state as PermissionState;
          
          setCameraPermissionWithLog(state);
          if (state === "granted") {
            setInitialCameraGrantedWithLog(true);
            onCameraPermissionGranted();
          } else {
            setInitialCameraGrantedWithLog(false);
          }
        } else {
          setCameraPermissionWithLog("prompt");
          setInitialCameraGrantedWithLog(false);
        }
      } finally {
        setPermissionsCheckedWithLog(true);
      }
    };

    checkCamera();
    
    if (cameraPermission === "granted") {
      const checkMic = async () => {
        try {
          if ("permissions" in navigator) {
            const permissionStatus = await navigator.permissions.query({
              name: "microphone" as PermissionName,
            });
            setMicPermission(permissionStatus.state as PermissionState);
            if (permissionStatus.state === "denied") {
              track("daydream_microphone_permission_denied", {
                is_authenticated: authenticated,
              });
            } else if (permissionStatus.state === "granted") {
              track("daydream_microphone_permission_granted", {
                is_authenticated: authenticated,
              });
            }
          } else {
            setMicPermission("prompt");
          }
        } catch (err) {
          setMicPermission("prompt");
        }
      };
      checkMic();
    }
  }, [cameraPermission]);

  useEffect(() => {
    if (
      permissionsChecked &&
      cameraPermission === "granted" &&
      initialCameraGranted &&
      !autoProceeded
    ) {
      const hasVisited = localStorage.getItem("hasSeenLandingPage");
      
      if (hasVisited) {
        setAutoProceededWithLog(true);
        onReady();
      } else {
        setCurrentScreenWithLog("prompts");
      }
    }
  }, [
    permissionsChecked,
    cameraPermission,
    autoProceeded,
    onReady,
    initialCameraGranted,
  ]);

  useEffect(() => {
    if (showPromptSelection) {
      setCurrentScreenWithLog("prompts");
    }
  }, [showPromptSelection]);

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
      stream.getTracks().forEach(track => track.stop());
      
      setCameraPermissionWithLog("granted");
      track("daydream_camera_permission_granted", {
        is_authenticated: authenticated,
      });
      onCameraPermissionGranted();
      
      setCurrentScreenWithLog("prompts");
    } catch (err) {
      setCameraPermissionWithLog("denied");
      track("daydream_camera_permission_denied", {
        is_authenticated: authenticated,
      });

      if (isMobile) {
        alert(
          "Please ensure camera permissions are enabled in your browser settings.",
        );
      }
    }
  };

  const handleBack = () => {
    setCurrentScreenWithLog("camera");
  };

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
      <a
        href="https://www.livepeer.org/terms-of-service-p"
        className="underline hover:text-primary"
      >
        Terms of Service
      </a>{" "}
      and{" "}
      <a
        href="https://www.livepeer.org/privacy-policy-p"
        className="underline hover:text-primary"
      >
        Privacy Policy
      </a>
    </p>
  );

  const handlePermissionContinue = async () => {
    setIsPermissionLoading(true);
    track("daydream_interstitial_continue_clicked", {
      is_authenticated: authenticated,
      camera_permission: cameraPermission,
      mic_permission: micPermission,
    });
    
    if (micPermission !== "granted") {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getTracks().forEach(track => track.stop());
        setMicPermission("granted");
        track("daydream_microphone_permission_granted", {
          is_authenticated: authenticated,
        });
      } catch (err) {
        setMicPermission("denied");
        track("daydream_microphone_permission_denied", {
          is_authenticated: authenticated,
        });
      }
    }
    
    if (cameraPermission !== "granted") {
      await requestCamera();
    } else {
      onCameraPermissionGranted();
      setCurrentScreenWithLog("prompts");
    }
    
    setCurrentScreenWithLog("prompts");
  };

  const handlePromptContinue = async () => {
    setIsPromptLoading(true);
    if (selectedPrompt && onPromptApply) {
      onPromptApply(selectedPrompt);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onReady();
    }
    setIsPromptLoading(false);
  };

  if (showLoginPrompt) {
    track("daydream_trial_expired_modal_shown", {
      is_authenticated: authenticated,
    });
    return (
      <TrialExpiredModal
        open={true}
        onOpenChange={open => {
          if (!open) {
            window.location.href = "/explore";
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

  if (
    permissionsChecked &&
    cameraPermission === "granted" &&
    initialCameraGranted &&
    !showPromptSelection
  ) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 md:p-0">
      <AnimatePresence mode="wait" initial={false}>
        {currentScreen === "camera" ? (
          <Slide keyName="camera" slideVariants={slideVariants}>
            <div className="bg-[#161616] border border-[#232323] rounded-xl p-3 sm:p-4 md:p-8 max-w-2xl w-full mx-auto shadow-lg">
              <div className="space-y-1 sm:space-y-2 md:space-y-3 mb-3 sm:mb-4 md:mb-8">
                <h1 className="text-lg sm:text-xl md:text-2xl font-semibold">
                  Enable camera access to start creating
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                  Grant access to begin exploring pipelines
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
                {steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 sm:gap-4 md:gap-6 py-4 sm:py-6 md:py-12 px-3 sm:px-4 md:px-6 rounded-lg border border-[#2e2e2e] bg-[#1c1c1c] relative overflow-hidden"
                  >
                    <step.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#00eb88] shrink-0" />
                    <div className="flex flex-col relative z-10">
                      <h3 className="text-sm sm:text-base md:text-lg font-bold">
                        {step.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <InterstitialDecor flip={i === 1} opacity={0.2} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center gap-4 mt-8">
                {(cameraPermission === "prompt" ||
                  cameraPermission === "granted") && (
                  <Button
                    onClick={handlePermissionContinue}
                    size="lg"
                    className="w-full rounded-full h-12 text-base active:opacity-70"
                    disabled={isPermissionLoading}
                  >
                    {isPermissionLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      "Continue"
                    )}
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
            <div className="bg-[#161616] border border-[#232323] rounded-xl p-3 sm:p-4 md:p-8 max-w-2xl w-full mx-auto shadow-lg">
              <div className="space-y-1 sm:space-y-2 md:space-y-3 mb-3 sm:mb-4 md:mb-8">
                <h1 className="text-lg sm:text-xl md:text-2xl font-semibold">
                  Select Your First Prompt
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                  Start tranforming your live video with AI. Select a preset
                  prompt to continue.
                  <br />
                  <br />
                  <span className="hidden md:inline">
                    Pro tip: Ensure good lightning and a steady background for
                    best results.
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                {examplePrompts.map((example, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedPrompt(example.prompt)}
                    className={`
                      relative h-32 sm:h-36 md:h-64 rounded-xl overflow-hidden cursor-pointer
                      ${selectedPrompt === example.prompt ? "ring-2 ring-[#00eb88]" : "border border-[#2e2e2e]"}
                      ${selectedPrompt && selectedPrompt !== example.prompt ? "opacity-25" : ""}
                    `}
                    style={{
                      backgroundImage: `url(${example.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div className="absolute bottom-0 w-full p-2 sm:p-3 md:p-4 bg-black/50 backdrop-blur-md rounded-t-xl">
                      <p className="text-white font-bold text-xs sm:text-sm md:text-base text-center">
                        {example.prompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mt-8">
                <Button
                  onClick={handlePromptContinue}
                  disabled={!selectedPrompt || isPromptLoading}
                  size="lg"
                  className="rounded-full h-12 flex-1"
                >
                  {isPromptLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    "Continue"
                  )}
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
