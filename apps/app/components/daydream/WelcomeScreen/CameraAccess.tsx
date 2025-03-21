import Image from "next/image";
import { useIsMobile } from "@repo/design-system/hooks/use-mobile";
import { CameraIcon, CheckIcon } from "lucide-react";
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

      if (hasVideo && hasAudio) {
        setCameraPermission("granted");
        track("daydream_media_permissions_granted", {
          is_authenticated: authenticated,
          camera: hasVideo,
          microphone: hasAudio,
        });
      } else if (hasVideo) {
        setCameraPermission("granted");
        track("daydream_media_permissions_granted", {
          is_authenticated: authenticated,
          camera: true,
          microphone: false,
        });
      } else if (hasAudio) {
        track("daydream_media_permissions_granted", {
          is_authenticated: authenticated,
          camera: false,
          microphone: true,
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
  const { currentStep, cameraPermission } = useOnboard();
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
        className={cn(
          "flex flex-col gap-3 animate-fade-in",
          currentStep === "camera" && "cursor-pointer",
        )}
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
              To transform your video we need access. Nothing is recorded unless
              you click "record"
            </p>
          </div>
          {cameraPermission === "granted" ? (
            <div className="bg-green-500 rounded-[7px] px-[10px] py-[7.8px] text-white font-inter text-[13px] leading-[1.21] flex items-center justify-center animate-[bounce_0.5s_ease-in-out]">
              <CheckIcon className="w-5 h-5" />
            </div>
          ) : (
            <button className="bg-[#282828] rounded-[7px] px-[13px] py-[7.8px] text-[#EDEDED] font-inter text-[13px] leading-[1.21] hover:opacity-90 transition-opacity flex items-center justify-center min-w-[80px]">
              Request
            </button>
          )}
        </div>
      </div>
      {cameraPermission === "denied" && (
        <p className="font-inter text-sm leading-[1.55] tracking-[-1.1%] text-[#161616] text-center">
          We couldn't load your permissions, please look into{" "}
          <a
            className="font-semibold underline"
            href="https://pipelines.livepeer.org/docs"
          >
            documentation
          </a>{" "}
          for help
        </p>
      )}
    </>
  );
}
