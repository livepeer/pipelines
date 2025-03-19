import DayDreamContent from "./DaydreamContent";
import { useOnboard } from "../OnboardContext";
import useMount from "@/hooks/useMount";
import { GlobalSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import { cn } from "@repo/design-system/lib/utils";

export default function MainExperience() {
  const { cameraPermission, currentStep } = useOnboard();

  useMount(() => {
    localStorage.setItem("hasSeenLandingPage", "true");
  });

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
