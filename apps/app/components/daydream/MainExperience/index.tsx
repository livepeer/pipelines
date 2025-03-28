import DayDreamContent from "./DaydreamContent";
import { useOnboard } from "../OnboardContext";
import { GlobalSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import { cn } from "@repo/design-system/lib/utils";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useMediaPermissions } from "../WelcomeScreen/CameraAccess";

export default function MainExperience() {
  const { currentStep, cameraPermission, setCameraPermission } = useOnboard();
  const { user } = usePrivy();
  const [isVisible, setIsVisible] = useState(false);
  const { requestMediaPermissions } = useMediaPermissions();

  // Request camera permission if not granted
  useEffect(() => {
    const requestCameraPermission = async () => {
      const hasAllowedCamera = await requestMediaPermissions();
      if (!hasAllowedCamera) {
        setCameraPermission("denied");
      }
    };

    if (currentStep === "main" && cameraPermission === "prompt") {
      requestCameraPermission();
    }
  }, [currentStep, cameraPermission, requestMediaPermissions]);

  useEffect(() => {
    if (currentStep === "main") {
      // Add a small delay to ensure the fade-in starts after the welcome screen fades out
      setTimeout(() => {
        setIsVisible(true);
      }, 100);
    } else {
      setIsVisible(false);
    }
  }, [currentStep, user?.id]);

  return (
    <SidebarProvider
      open={false}
      className={cn(
        currentStep !== "main" ? "hidden" : "",
        "transition-opacity duration-500",
        isVisible ? "opacity-100" : "opacity-0",
      )}
    >
      <GlobalSidebar>
        <div className="flex h-screen md:h-auto md:min-h-[calc(100vh-2rem)] flex-col px-2 md:px-6">
          <DayDreamContent />
        </div>
      </GlobalSidebar>
    </SidebarProvider>
  );
}
