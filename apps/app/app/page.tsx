"use client";
import ClientSideTracker from "@/components/analytics/ClientSideTracker";
import Dreamshaper from "@/components/welcome/featured/dreamshaper";
import Interstitial from "@/components/welcome/featured/interstitial";
import { type ReactElement, useState } from "react";

const App = (): ReactElement => {
  const [showInterstitial, setShowInterstitial] = useState(() => {
    if (typeof window === "undefined") return false;
    const hasSeenInterstitial = localStorage.getItem("hasSeenInterstitial");
    console.log("localStorage", hasSeenInterstitial);
    return !hasSeenInterstitial;
  });

  return (
    <div>
      {showInterstitial && (
        <Interstitial
          onReady={() => {
            localStorage.setItem("hasSeenInterstitial", "true");
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
