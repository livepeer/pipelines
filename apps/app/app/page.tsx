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
    // Your logic to dismiss the interstitial (e.g., hide it from view)
    console.log("Interstitial dismissed via GET STARTED");
    setShowInterstitial(false);
  };

  const handlePromptApply = (prompt: string) => {
    // When a prompt is selected, apply it to your prompt textbox and trigger your update
    console.log("Auto-applying selected prompt:", prompt);
    // You might set state in your parent component or call the handleUpdate function here.
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

      <Dreamshaper />
      <ClientSideTracker eventName="home_page_view" />
    </div>
  );
};

export default App;
