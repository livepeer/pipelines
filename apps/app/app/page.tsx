"use client";
import ClientSideTracker from "@/components/analytics/ClientSideTracker";
import Dreamshaper from "@/components/welcome/featured/dreamshaper";
import Interstitial from "@/components/welcome/featured/interstitial";
import { type ReactElement, useState } from "react";

const App = (): ReactElement => {
  // Temporarily always show the interstitial for development
  const [showInterstitial, setShowInterstitial] = useState(true);

  return (
    <div>
      {showInterstitial && (
        <Interstitial
          onReady={() => {
            setShowInterstitial(false);
          }}
        />
      )}

      <Dreamshaper />
      <ClientSideTracker eventName="home_page_view" />
    </div>
  );
};

export default App;
