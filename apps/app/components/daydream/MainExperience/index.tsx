import ClientSideTracker from "@/components/analytics/ClientSideTracker";
import { GlobalSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import { cn } from "@repo/design-system/lib/utils";
import { useEffect, useState } from "react";
import { useOnboard } from "../OnboardContext";
import { useMediaPermissions } from "../WelcomeScreen/CameraAccess";
import Dreamshaper from "@/components/welcome/featured/Dreamshaper";
import { usePrivy } from "@/hooks/usePrivy";
import { useCapacityCheck } from "@/hooks/useCapacityCheck";

interface MainExperienceProps {
  isGuestMode?: boolean;
}

export default function MainExperience({
  isGuestMode = false,
}: MainExperienceProps) {
  const { currentStep, cameraPermission, setCameraPermission } = useOnboard();
  const { user } = usePrivy();
  const [isVisible, setIsVisible] = useState(false);
  const { requestMediaPermissions } = useMediaPermissions();
  const { hasCapacity, loading } = useCapacityCheck();

  // Request camera permission if not granted (skip in guest mode)
  useEffect(() => {
    if (isGuestMode) return;
    if (loading) return;
    if (!hasCapacity) return;

    const requestCameraPermission = async () => {
      const hasAllowedCamera = await requestMediaPermissions();
      if (!hasAllowedCamera) {
        setCameraPermission("denied");
      }
    };

    if (currentStep === "main" && cameraPermission === "prompt") {
      requestCameraPermission();
    }
  }, [currentStep, cameraPermission, requestMediaPermissions, isGuestMode]);

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
          <Dreamshaper isGuestMode={isGuestMode} />
          <ClientSideTracker eventName="home_page_view" />
        </div>
      </GlobalSidebar>
    </SidebarProvider>
  );
}
