"use client";

import { usePrivy } from "@privy-io/react-auth";
import LoginScreen from "./LoginScreen";
import WelcomeScreen from "./WelcomeScreen";
import { OnboardProvider } from "./OnboardContext";

export default function Daydream() {
  const { user } = usePrivy();

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <OnboardProvider>
      <WelcomeScreen />
    </OnboardProvider>
  );
}
