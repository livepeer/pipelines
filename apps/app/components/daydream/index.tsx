"use client";

import { usePrivy } from "@privy-io/react-auth";
import DayDreamContent from "./DaydreamContent";
import LoginScreen from "./LoginScreen";

export default function Daydream() {
  const { user } = usePrivy();

  if (!user) {
    return <LoginScreen />;
  }

  return <DayDreamContent />;
}
