"use client";
import ClientSideTracker from "@/components/analytics/ClientSideTracker";
import Dreamshaper from "@/components/welcome/featured/dreamshaper";
import Interstitial from "@/components/welcome/featured/interstitial";
import { type ReactElement, useState } from "react";
import { useDreamshaper } from "@/components/welcome/featured/useDreamshaper";

const App = (): ReactElement => {
  // Temporarily always show the interstitial for development
  const [showInterstitial, setShowInterstitial] = useState(true);
  const dreamshaperState = useDreamshaper();
  const { stream, outputPlaybackId, handleUpdate, loading } = dreamshaperState;

  const handleReady = () => {
      setShowInterstitial(false);
  };

  const handlePromptApply = (prompt: string) => {
    console.log("Auto-applying selected prompt silently:", prompt);
    if (handleUpdate) {
      handleUpdate(prompt, { silent: true });
    }
  };

  // Only render the Interstitial once we have a valid stream
  if (loading || !stream) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Creating your stream...</p>
      </div>
    );
  }

  return (
    <div>
      {showInterstitial && (
        <Interstitial
          streamId={stream.id}
          outputPlaybackId={outputPlaybackId}
          onReady={handleReady}
          onPromptApply={handlePromptApply}
        />
      )}

      <Dreamshaper 
        {...dreamshaperState} 
      />
      <ClientSideTracker eventName="home_page_view" />
    </div>
  );
};

export default App;
