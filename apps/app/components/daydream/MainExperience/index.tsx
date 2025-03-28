import ClientSideTracker from "@/components/analytics/ClientSideTracker";
import { GlobalSidebar } from "@/components/sidebar";
import Dreamshaper from "@/components/welcome/featured/Dreamshaper";
import { usePrivy } from "@/hooks/usePrivy";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import { cn } from "@repo/design-system/lib/utils";
import { useEffect, useState } from "react";
import { useOnboard } from "../OnboardContext";

export default function MainExperience() {
  const { cameraPermission, currentStep } = useOnboard();
  const { user } = usePrivy();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (currentStep === "main") {
      localStorage.setItem(`hasSeenLandingPage-${user?.id}`, "true");
      // Add a small delay to ensure the fade-in starts after the welcome screen fades out
      setTimeout(() => {
        setIsVisible(true);
      }, 100);
    } else {
      setIsVisible(false);
    }
  }, [currentStep, user?.id]);

  return cameraPermission === "granted" ? (
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
          <Dreamshaper />
          <ClientSideTracker eventName="home_page_view" />
        </div>
      </GlobalSidebar>
    </SidebarProvider>
  ) : null;
}
