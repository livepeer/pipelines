import DayDreamContent from "./DaydreamContent";
import { useOnboard } from "../OnboardContext";

export default function MainExperience() {
  const { cameraPermission } = useOnboard();

  return cameraPermission === "granted" ? <DayDreamContent /> : null;
}
