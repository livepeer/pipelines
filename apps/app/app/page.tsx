"use client";
import ClientSideTracker from "@/components/analytics/ClientSideTracker";
import Dreamshaper from "@/components/welcome/featured/dreamshaper";
import Interstitial from "@/components/welcome/featured/interstitial";
import { ReactElement, useState, useEffect } from "react";
import { useDreamshaper } from "@/components/welcome/featured/useDreamshaper";
import { usePrivy } from "@privy-io/react-auth";

const App = (): ReactElement => {
  const { user, authenticated } = usePrivy();
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [streamKilled, setStreamKilled] = useState(false);
  const dreamshaperState = useDreamshaper();
  const { stream, outputPlaybackId, handleUpdate, loading } = dreamshaperState;

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasSeenLandingPage');
    if (!hasVisited) {
      setShowInterstitial(true);
      localStorage.setItem('hasSeenLandingPage', 'true');
    }
  }, []);

  useEffect(() => {
    if (!authenticated) {
      const timer = setTimeout(() => {
        console.log("Killing stream due to reach timeout and user is not authenticated");
        setStreamKilled(true);
        setShowInterstitial(true);
      }, 2 * 60 * 1000); // 10 minutes in ms - DEBUG is just 2 minutes
      return () => clearTimeout(timer);
    }
  }, [authenticated]);

  const handleReady = () => {
    setShowInterstitial(false);
    setStreamKilled(false);
  };

  const handlePromptApply = (prompt: string) => {
    console.log("Auto-applying selected prompt silently:", prompt);
    if (handleUpdate) {
      handleUpdate(prompt, { silent: true });
    }
  };

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
