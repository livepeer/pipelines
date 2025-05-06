"use client";

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
import { BentoGrids } from "@/app/(main)/BentoGrids";
import { useStreamUpdates } from "@/hooks/useDreamshaper";
import { WelcomeOverlay } from "@/components/welcome/featured/WelcomeOverlay";

interface MainExperienceProps {
  isGuestMode?: boolean;
}

export default function MainExperience({
  isGuestMode = false,
}: MainExperienceProps) {
  const { currentStep, cameraPermission, setCameraPermission } = useOnboard();
  const { user } = usePrivy();
  const [isVisible, setIsVisible] = useState(true);
  const { requestMediaPermissions } = useMediaPermissions();
  const { hasCapacity, loading } = useCapacityCheck();
  const { handleStreamUpdate } = useStreamUpdates();
  const [showWelcome, setShowWelcome] = useState(false);

  // Check if this is the first time user or guest mode
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("has_seen_welcome");
    if (!hasSeenWelcome || isGuestMode) {
      setShowWelcome(true);
    }
  }, [isGuestMode]);

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

    if (cameraPermission === "prompt") {
      requestCameraPermission();
    }
  }, [
    cameraPermission,
    requestMediaPermissions,
    isGuestMode,
    loading,
    hasCapacity,
  ]);

  useEffect(() => {
    console.log("Current step:", currentStep);
    console.log("Is visible:", isVisible);
    console.log("Show welcome:", showWelcome);
  }, [currentStep, isVisible, showWelcome]);

  const handleTryPrompt = (prompt: string) => {
    if (prompt && handleStreamUpdate) {
      handleStreamUpdate(prompt, { silent: true });
    }
  };

  return (
    <div className="w-full h-screen">
      <SidebarProvider
        open={false}
        className={cn(
          "transition-opacity duration-500 w-full h-full",
          isVisible ? "opacity-100" : "opacity-0",
        )}
      >
        <GlobalSidebar>
          <div className="flex flex-col lg:flex-row h-full">
            {/* Left side - Dreamshaper */}
            <div className="flex-1 flex flex-col px-2 md:px-6">
              <Dreamshaper isGuestMode={isGuestMode} />
              <ClientSideTracker eventName="home_page_view" />
            </div>

            {/* Right side - BentoGrid */}
            <div className="lg:w-1/3 lg:border-l border-gray-200 dark:border-gray-800 overflow-y-auto">
              <div className="p-4">
                <BentoGrids
                  initialClips={[]}
                  isOverlayMode={false}
                  onTryPrompt={handleTryPrompt}
                  hasCapacity={hasCapacity}
                />
              </div>
            </div>
          </div>
        </GlobalSidebar>

        {/* Welcome Overlay */}
        <WelcomeOverlay
          open={showWelcome}
          onOpenChange={setShowWelcome}
          isGuestMode={isGuestMode}
        />
      </SidebarProvider>
    </div>
  );
}
