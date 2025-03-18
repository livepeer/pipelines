"use client";

import { usePrivy } from "@privy-io/react-auth";
import LoginScreen from "./LoginScreen";
import WelcomeScreen from "./WelcomeScreen";
import { OnboardProvider } from "./OnboardContext";
import { Loader2 } from "lucide-react";
import MainExperience from "./MainExperience";

export default function Daydream() {
  const { user, ready } = usePrivy();

  // If the user is not ready, show a loading screen
  if (!ready) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If the user is not logged in, show the login screen
  if (!user) {
    return <LoginScreen />;
  }

  // If the user is logged in, show the onboarding screen and main experience
  return (
    <OnboardProvider>
      <WelcomeScreen />
      <MainExperience />
    </OnboardProvider>
  );
}
