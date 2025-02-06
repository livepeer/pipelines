"use client";
import ClientSideTracker from "@/components/analytics/ClientSideTracker";
import Dreamshaper from "@/components/welcome/featured/dreamshaper";
import Interstitial from "@/components/welcome/featured/interstitial";
import { ReactElement, useState, useEffect } from "react";
import { useDreamshaper } from "@/components/welcome/featured/useDreamshaper";

const App = (): ReactElement => {
  const [showInterstitial, setShowInterstitial] = useState(false);
  const dreamshaperState = useDreamshaper();
  const { stream, outputPlaybackId, handleUpdate, loading } = dreamshaperState;

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasSeenLandingPage');
    if (!hasVisited) {
      setShowInterstitial(true);
      localStorage.setItem('hasSeenLandingPage', 'true');
    }
  }, []);

  const handleReady = () => {
    setShowInterstitial(false);
  };

  const handlePromptApply = (prompt: string) => {
    console.log("Auto-applying selected prompt silently:", prompt);
    if (handleUpdate) {
      handleUpdate(prompt, { silent: true });
    }
  };

  return (
    <div className="relative">
      <Dreamshaper {...dreamshaperState} />
      <ClientSideTracker eventName="home_page_view" />
      {showInterstitial && (
        <Interstitial
          streamId={stream?.id}
          outputPlaybackId={outputPlaybackId}
          onReady={handleReady}
          onPromptApply={handlePromptApply}
        />
      )}
    </div>
  );
};

export default App;
