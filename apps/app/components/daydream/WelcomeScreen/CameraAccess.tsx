import Image from "next/image";
import { useIsMobile } from "@repo/design-system/hooks/use-mobile";
import { CameraIcon, RefreshCcwIcon } from "lucide-react";
import { useOnboard } from "../OnboardContext";
import track from "@/lib/track";
import { usePrivy } from "@privy-io/react-auth";
import { cn } from "@repo/design-system/lib/utils";

const useMediaPermissions = () => {
  const { setCameraPermission, setCurrentStep, hasSharedPrompt } = useOnboard();
  const { authenticated } = usePrivy();

  const requestMediaPermissions = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const constraints = isMobile
      ? {
          video: { facingMode: "user" },
          audio: true,
        }
      : {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: true,
        };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      const hasVideo = stream.getVideoTracks().length > 0;
      const hasAudio = stream.getAudioTracks().length > 0;

      stream.getTracks().forEach(track => track.stop());

      if (hasVideo) {
        setCameraPermission("granted");
        track("daydream_camera_permission_granted", {
          is_authenticated: authenticated,
        });
      }

      if (hasAudio) {
        track("daydream_microphone_permission_granted", {
          is_authenticated: authenticated,
        });
      }

      setCurrentStep(hasSharedPrompt ? "main" : "prompt");
    } catch (err) {
      if (
        err instanceof Error &&
        err.name === "NotAllowedError" &&
        err.message === "Permission denied"
      ) {
        setCameraPermission("denied");
        track("daydream_media_permission_denied", {
          is_authenticated: authenticated,
        });
      }

      if (isMobile) {
        alert(
          "Please ensure camera and microphone permissions are enabled in your browser settings.",
        );
      }
    }
  };

  return requestMediaPermissions;
};

export default function CameraAccess() {
  const isMobile = useIsMobile();
  const { currentStep, cameraPermission, setCurrentStep } = useOnboard();
  const requestMediaPermissions = useMediaPermissions();

  if (currentStep === "persona") {
    return null;
  }

  return (
    <>
      <p className="font-semibold font-playfair text-start text-xl sm:text-3xl">
        {" "}
        Before we start
      </p>
      <div
        className="flex flex-col gap-3 cursor-pointer animate-fade-in"
        onClick={currentStep === "camera" ? requestMediaPermissions : undefined}
      >
        <div
          className={cn(
            "flex items-center gap-4 bg-[#E1E6E9] border border-[#C5C2C2] rounded-lg p-4",
            cameraPermission === "denied" && "border-red-500",
          )}
        >
          <div className="relative w-6 h-6">
            <CameraIcon className="[stroke:#7196A7] [stroke-width:2px]" />
          </div>
          <div
            className={`flex flex-col gap-2 ${isMobile ? "flex-1" : "w-[586px]"}`}
          >
            <h3
              className={`font-playfair font-semibold ${isMobile ? "text-sm" : "text-lg"} tracking-[-1.1%] text-left`}
            >
              We will need access to your Camera & Microphone
            </h3>
            <p className="font-inter text-xs leading-[1.55] tracking-[-1.1%] text-[#161616]">
              In order to transform your video we need access to these devices
            </p>
          </div>
          <button className="flex justify-center items-center gap-2 bg-[#EDEDED] rounded-md p-2 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="relative w-4 h-4 text-black flex items-center justify-center">
              <RefreshCcwIcon className="[stroke:#7196A7] [stroke-width:1.5px] [stroke-thickness:4px]" />
            </div>
          </button>
        </div>
      </div>
      {cameraPermission === "denied" && (
        <p className="font-inter text-sm leading-[1.55] tracking-[-1.1%] text-[#161616] text-center">
          We couldn’t load your permissions, please look into{" "}
          <span className="font-semibold underline">documentation</span> for
          help
        </p>
      )}
    </>
  );
}
