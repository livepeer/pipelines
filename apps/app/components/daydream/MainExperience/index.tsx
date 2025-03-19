import DayDreamContent from "./DaydreamContent";
import { useOnboard } from "../OnboardContext";
import { GlobalSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import { cn } from "@repo/design-system/lib/utils";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";

export default function MainExperience() {
  const { cameraPermission, currentStep } = useOnboard();
  const { setTheme } = useTheme();
  const { user } = usePrivy();

  useEffect(() => {
    if (currentStep === "main") {
      setTheme("dark");
      localStorage.setItem(`hasSeenLandingPage-${user?.id}`, "true");
    }
  }, [currentStep, setTheme, user?.id]);

  return cameraPermission === "granted" ? (
    <SidebarProvider
      open={false}
      className={cn(currentStep !== "main" ? "hidden" : "")}
    >
      <GlobalSidebar>
        <div className="flex h-screen md:h-auto md:min-h-[calc(100vh-2rem)] flex-col px-2 md:px-6">
          <DayDreamContent />
        </div>
      </GlobalSidebar>
    </SidebarProvider>
  ) : null;
}
