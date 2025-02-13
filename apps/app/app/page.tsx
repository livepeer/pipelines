"use client";
import ClientSideTracker from "@/components/analytics/ClientSideTracker";
import Dreamshaper from "@/components/welcome/featured/dreamshaper";
import Interstitial from "@/components/welcome/featured/interstitial";
import { ReactElement, useState, useEffect } from "react";
import { useDreamshaper } from "@/components/welcome/featured/useDreamshaper";
import { usePrivy } from "@privy-io/react-auth";
import { useStreamStatus } from "@/hooks/useStreamStatus";

const UNREGISTERED_APP_TRIAL_TIMEOUT = 10 * 60 * 1000; 

const App = (): ReactElement => {
  const { user, authenticated } = usePrivy();
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [streamKilled, setStreamKilled] = useState(false);
  const dreamshaperState = useDreamshaper();
  const { stream, outputPlaybackId, handleUpdate, loading } = dreamshaperState;

  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const { status } = useStreamStatus(stream?.id || "", false);

  useEffect(() => {
    const hasVisited = localStorage.getItem("hasSeenLandingPage");
    if (!hasVisited) {
      setShowInterstitial(true);
      localStorage.setItem("hasSeenLandingPage", "true");
    }
  }, []);

  useEffect(() => {
    if (!authenticated) {
      const timer = setTimeout(() => {
        console.log("Killing stream due to reach timeout and user is not authenticated");
        setStreamKilled(true);
        setShowInterstitial(true);
      }, UNREGISTERED_APP_TRIAL_TIMEOUT);
      return () => clearTimeout(timer);
    }
  }, [authenticated]);

  // Debug event listener to trigger the timeout manually.
  useEffect(() => {
    const debugHandler = () => {
      console.log("Debug: Triggering manual stream timeout");
      setStreamKilled(true);
      setShowInterstitial(true);
    };
    window.addEventListener("triggerTimeoutDebug", debugHandler);
    return () => window.removeEventListener("triggerTimeoutDebug", debugHandler);
  }, []);

  useEffect(() => {
    const trialExpiredHandler = () => {
      console.log("Trial expired: Not enough time remaining");
      setStreamKilled(true);
      setShowInterstitial(true);
    };
    window.addEventListener("trialExpired", trialExpiredHandler);
    return () => window.removeEventListener("trialExpired", trialExpiredHandler);
  }, []);

  const handleReady = () => {
    setShowInterstitial(false);
    setStreamKilled(false);
  };

  const handlePromptApply = (prompt: string) => {
    console.log("Saving selected prompt silently for later application:", prompt);
    setPendingPrompt(prompt);
  };

  useEffect(() => {
    if (pendingPrompt && status === "ONLINE") {
      console.log("Stream is ONLINE, applying pending prompt:", pendingPrompt);
      if (handleUpdate) {
        handleUpdate(pendingPrompt, { silent: true });
      }
      setPendingPrompt(null);
    }
  }, [pendingPrompt, status, handleUpdate]);

  return (
    <div className="relative">
      <Dreamshaper {...dreamshaperState} streamKilled={streamKilled} />
      <ClientSideTracker eventName="home_page_view" />
      {showInterstitial && (
        <Interstitial
          streamId={stream?.id}
          outputPlaybackId={outputPlaybackId}
          onReady={handleReady}
          onPromptApply={handlePromptApply}
          showLoginPrompt={streamKilled}
        />
      )}
    </div>
  );
};

export default App;
