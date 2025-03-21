"use client";

import { usePrivy } from "@privy-io/react-auth";
import LoginScreen from "./LoginScreen";
import WelcomeScreen from "./WelcomeScreen";
import { OnboardProvider, useOnboard } from "./OnboardContext";
import { Loader2 } from "lucide-react";
import MainExperience from "./MainExperience";
import { useEffect } from "react";
import LayoutWrapper from "./LayoutWrapper";

export default function Daydream({
  hasSharedPrompt,
}: {
  hasSharedPrompt: boolean;
}) {
  const { user, ready } = usePrivy();

  // If the user is not ready, show a loading screen
  if (!ready) {
    return (
      <LayoutWrapper>
        <div className="w-full h-screen flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </LayoutWrapper>
    );
  }

  // If the user is not logged in, show the login screen
  if (!user) {
    return (
      <LayoutWrapper>
        <LoginScreen />
      </LayoutWrapper>
    );
  }

  // If the user is logged in, show the onboarding screen and main experience
  return (
    <OnboardProvider hasSharedPrompt={hasSharedPrompt}>
      <DaydreamRenderer />
    </OnboardProvider>
  );
}

function DaydreamRenderer() {
  const {
    initialCameraValidation,
    setInitialCameraValidation,
    setCameraPermission,
    setCurrentStep,
  } = useOnboard();
  const { user } = usePrivy();

  // Check if the user has camera permission
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if ("permissions" in navigator) {
          const hasVisited = localStorage.getItem(
            `hasSeenLandingPage-${user?.id}`,
          );
          const cameraPermission = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });

          if (cameraPermission.state === "granted") {
            setCameraPermission("granted");
            if (hasVisited) {
              setCurrentStep("main");
            }
          }
        }
      } catch (err) {
        console.error("Error checking camera permission:", err);
      } finally {
        setInitialCameraValidation(true);
      }
    };

    checkPermissions();
  }, []);

  if (!initialCameraValidation) {
    return (
      <LayoutWrapper>
        <div className="w-full h-screen flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <>
      <WelcomeScreen />
      <MainExperience />
    </>
  );
}
