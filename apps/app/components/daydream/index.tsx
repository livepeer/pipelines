"use client";

import { usePrivy } from "@privy-io/react-auth";
import LoginScreen from "./LoginScreen";
import WelcomeScreen from "./WelcomeScreen";
import { OnboardProvider } from "./OnboardContext";
import { Loader2 } from "lucide-react";

export default function Daydream() {
  const { user, ready } = usePrivy();

  if (!ready) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <OnboardProvider>
      <WelcomeScreen />
    </OnboardProvider>
  );
}
