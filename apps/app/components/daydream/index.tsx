"use client";

import { createUser } from "@/app/actions/user";
import { useMixpanelStore } from "@/hooks/useMixpanelStore";
import { usePrivy } from "@/hooks/usePrivy";
import { submitToHubspot } from "@/lib/analytics/hubspot";
import { identifyUser } from "@/lib/analytics/mixpanel";
import track from "@/lib/track";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import LayoutWrapper from "./LayoutWrapper";
import LoginScreen from "./LoginScreen";
import { AuthProvider } from "./LoginScreen/AuthContext";
import MainExperience from "./MainExperience";
import { OnboardProvider, useOnboard } from "./OnboardContext";
import WelcomeScreen from "./WelcomeScreen";

export default function Daydream({
  hasSharedPrompt,
  isOAuthSuccessRedirect,
}: {
  hasSharedPrompt: boolean;
  isOAuthSuccessRedirect: boolean;
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
        <AuthProvider>
          <LoginScreen isOAuthSuccessRedirect={isOAuthSuccessRedirect} />
        </AuthProvider>
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
    isInitializing,
    setIsInitializing,
    setCameraPermission,
    setCurrentStep,
    currentStep,
    setSelectedPersonas,
    setCustomPersona,
  } = useOnboard();
  const { user } = usePrivy();
  const { distinctId } = useMixpanelStore();

  useEffect(() => {
    const initUser = async () => {
      try {
        if (!user?.id) {
          console.log(
            "DaydreamRenderer Effect: No user or user.id, returning.",
          ); // 디버깅 로그 필요시 추가
          return;
        }

        // 1. Create or fetch the user from DB
        const {
          isNewUser,
          user: { additional_details },
        } = await createUser(user);

        const initialStep =
          additional_details.next_onboarding_step ?? "persona";
        const initialPersonas = additional_details.personas ?? [];
        const initialCustomPersona = additional_details.custom_persona ?? "";

        // 2. If the user is in main experience, check for camera permissions initially
        if (initialStep === "main") {
          try {
            if ("permissions" in navigator) {
              const cameraPermission = await navigator.permissions.query({
                name: "camera" as PermissionName,
              });

              if (cameraPermission.state === "granted") {
                setCameraPermission("granted");
              }
            }
          } catch (err) {
            console.error("Error checking camera permission:", err);
          }
        }

        setSelectedPersonas(initialPersonas);
        setCustomPersona(initialCustomPersona);
        setCurrentStep(initialStep);
        setIsInitializing(false);

        track("user_logged_in", {
          user_id: user.id,
          distinct_id: distinctId,
        });

        if (isNewUser) {
          await submitToHubspot(user);
        }
      } catch (err) {
        console.error("Error initializing user:", err);
        setIsInitializing(false);
      }
    };

    initUser();
  }, [distinctId, user]);

  if (isInitializing) {
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
      {["main", "prompt"].includes(currentStep) && <MainExperience />}
    </>
  );
}
