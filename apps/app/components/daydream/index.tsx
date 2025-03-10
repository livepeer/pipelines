"use client";

import ClientSideTracker from "@/components/analytics/ClientSideTracker";
import Dreamshaper from "@/components/welcome/featured/dreamshaper";
import Interstitial from "@/components/welcome/featured/interstitial";
import { ReactElement, useState, useEffect } from "react";
import { useDreamshaper } from "@/components/welcome/featured/useDreamshaper";
import { usePrivy } from "@privy-io/react-auth";
import { useStreamStatus } from "@/hooks/useStreamStatus";

const UNREGISTERED_APP_TRIAL_TIMEOUT = 10 * 60 * 1000;

export default function DayDreamContent(): ReactElement {
  const { authenticated } = usePrivy();
  const [showInterstitial, setShowInterstitial] = useState(true);
  const [streamKilled, setStreamKilled] = useState(false);
  const dreamshaperState = useDreamshaper();
  const { stream, outputPlaybackId, handleUpdate, loading, pipeline } =
    dreamshaperState;
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [showPromptSelection, setShowPromptSelection] = useState(false);

  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  // Get shared prompt from URL if available
  const [sharedPrompt, setSharedPrompt] = useState<string | null>(null);

  const { status, isLive, statusMessage, capacityReached, fullResponse } =
    useStreamStatus(stream?.id || "", false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const sharedPromptParam = urlParams.get("shared");
      if (sharedPromptParam) {
        setSharedPrompt(sharedPromptParam);
      }
    }
  }, []);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if ("permissions" in navigator) {
          const cameraPermission = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });

          if (cameraPermission.state === "granted") {
            setCameraPermissionGranted(true);
            const hasVisited = localStorage.getItem("hasSeenLandingPage");

            if (hasVisited) {
              setShowInterstitial(false);
            }
          } else {
            localStorage.removeItem("hasSelectedPrompt");
          }
        }
      } catch (err) {
        console.error("Error checking camera permission:", err);
      }
    };

    checkPermissions();
  }, []);

  useEffect(() => {
    if (!authenticated) {
      const timer = setTimeout(() => {
        setStreamKilled(true);
        setShowInterstitial(true);
      }, UNREGISTERED_APP_TRIAL_TIMEOUT);
      return () => clearTimeout(timer);
    }
  }, [authenticated]);

  useEffect(() => {
    const debugHandler = () => {
      setStreamKilled(true);
      setShowInterstitial(true);
    };
    window.addEventListener("triggerTimeoutDebug", debugHandler);
    return () =>
      window.removeEventListener("triggerTimeoutDebug", debugHandler);
  }, []);

  useEffect(() => {
    const trialExpiredHandler = () => {
      setStreamKilled(true);
      setShowInterstitial(true);
    };
    window.addEventListener("trialExpired", trialExpiredHandler);
    return () =>
      window.removeEventListener("trialExpired", trialExpiredHandler);
  }, []);

  const handleReady = () => {
    setShowInterstitial(false);
    setStreamKilled(false);
    setShowPromptSelection(false);
  };

  const handlePromptApply = (prompt: string) => {
    setPendingPrompt(prompt + " ((clothed))");
    localStorage.setItem("hasSelectedPrompt", "true");
  };

  const handleCameraPermissionGranted = () => {
    setCameraPermissionGranted(true);

    // Skip prompt selection if we have a shared prompt
    if (sharedPrompt) {
      handleReady();
    } else {
      // Original logic for non-shared link cases
      const hasSelectedPrompt = localStorage.getItem("hasSelectedPrompt");
      if (!hasSelectedPrompt) {
        setShowPromptSelection(true);
      } else {
        handleReady();
      }
    }

    localStorage.removeItem("hasSeenLandingPage");
  };

  useEffect(() => {
    if (pendingPrompt && status === "ONLINE") {
      if (handleUpdate) {
        handleUpdate(pendingPrompt, { silent: true });
      }
      setPendingPrompt(null);
    }
  }, [pendingPrompt, status, handleUpdate]);

  return (
    <div className="relative">
      {cameraPermissionGranted && (
        <div className={showInterstitial ? "hidden" : ""}>
          <Dreamshaper
            {...dreamshaperState}
            streamKilled={streamKilled}
            live={isLive}
            statusMessage={statusMessage}
            streamKey={stream?.stream_key}
            streamId={stream?.id}
            capacityReached={capacityReached}
            status={status}
            fullResponse={fullResponse}
            pipeline={pipeline}
          />
          <ClientSideTracker eventName="home_page_view" />
        </div>
      )}

      {showInterstitial && (
        <Interstitial
          streamId={stream?.id}
          outputPlaybackId={outputPlaybackId}
          onReady={handleReady}
          onPromptApply={handlePromptApply}
          showLoginPrompt={streamKilled}
          onCameraPermissionGranted={handleCameraPermissionGranted}
          showPromptSelection={showPromptSelection && !sharedPrompt}
          sharedPrompt={sharedPrompt}
        />
      )}
    </div>
  );
}
