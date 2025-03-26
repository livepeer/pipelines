"use client";

import ClientSideTracker from "@/components/analytics/ClientSideTracker";
import Dreamshaper from "@/components/welcome/featured/dreamshaper";
import { useEffect } from "react";
import { useDreamshaper } from "@/components/welcome/featured/useDreamshaper";
import { useStreamStatus } from "@/hooks/useStreamStatus";
import { useOnboard } from "../OnboardContext";

export default function MainExperience() {
  const dreamshaperState = useDreamshaper();
  const { stream, handleUpdate, pipeline } = dreamshaperState;
  const { status, isLive, statusMessage, capacityReached, fullResponse } =
    useStreamStatus(stream?.id || "", false);

  const { currentStep, selectedPrompt, setSelectedPrompt } = useOnboard();

  useEffect(() => {
    if (selectedPrompt && status === "ONLINE") {
      if (handleUpdate) {
        handleUpdate(selectedPrompt, { silent: true });
      }
      setSelectedPrompt(null);
    }
  }, [selectedPrompt, status, handleUpdate]);

  const examplePrompt = selectedPrompt;

  return (
    <div className="relative">
      <div className={currentStep !== "main" ? "hidden" : ""}>
        <Dreamshaper
          {...dreamshaperState}
          live={isLive}
          statusMessage={statusMessage}
          streamKey={stream?.stream_key}
          streamId={stream?.id}
          capacityReached={capacityReached}
          status={status}
          fullResponse={fullResponse}
          pipeline={pipeline}
          sharedPrompt={dreamshaperState.sharedPrompt || examplePrompt}
        />
        <ClientSideTracker eventName="home_page_view" />
      </div>
    </div>
  );
}
