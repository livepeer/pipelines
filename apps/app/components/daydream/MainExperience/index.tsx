import DayDreamContent from "./DaydreamContent";
import { useOnboard } from "../OnboardContext";
import useMount from "@/hooks/useMount";

export default function MainExperience() {
  const { cameraPermission } = useOnboard();

  useMount(() => {
    localStorage.setItem("hasSeenLandingPage", "true");
  });

  return cameraPermission === "granted" ? <DayDreamContent /> : null;
}
