"use client";

import MainExperience from "@/components/daydream/MainExperience";
import { OnboardProvider } from "@/components/daydream/OnboardContext";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <OnboardProvider hasSharedPrompt={false}>
        <MainExperience />
      </OnboardProvider>
    </main>
  );
}
