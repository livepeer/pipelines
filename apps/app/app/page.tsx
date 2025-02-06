"use client";
import ClientSideTracker from "@/components/analytics/ClientSideTracker";
import Dreamshaper from "@/components/welcome/featured/dreamshaper";
import Interstitial from "@/components/welcome/featured/interstitial";
import { type ReactElement, useState } from "react";
import { useDreamshaper } from "@/components/welcome/featured/useDreamshaper";

const App = (): ReactElement => {
  // Temporarily always show the interstitial for development
  const [showInterstitial, setShowInterstitial] = useState(true);
  const { stream, outputPlaybackId, handleUpdate, loading } = useDreamshaper();

  const handleReady = () => {
    console.log("Interstitial dismissed via GET STARTED");
    setShowInterstitial(false);
  };

  const handlePromptApply = (prompt: string) => {
    console.log("Auto-applying selected prompt:", prompt);
  };

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
        stream={stream} 
        outputPlaybackId={outputPlaybackId}
        handleUpdate={handleUpdate}
      />
      <ClientSideTracker eventName="home_page_view" />
    </div>
  );
};

export default App;
