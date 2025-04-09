"use client";

import LoginScreen from "./LoginScreen";
import WelcomeScreen from "./WelcomeScreen";
import { OnboardProvider, useOnboard } from "./OnboardContext";
import { Loader2 } from "lucide-react";
import MainExperience from "./MainExperience";
import { useEffect } from "react";
import LayoutWrapper from "./LayoutWrapper";
import { AuthProvider } from "./LoginScreen/AuthContext";
import { createUser } from "@/app/actions/user";
import { identifyUser } from "@/lib/analytics/mixpanel";
import { submitToHubspot } from "@/lib/analytics/hubspot";
import track from "@/lib/track";
import { usePrivy } from "@/hooks/usePrivy";

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

  useEffect(() => {
    const initUser = async () => {
      try {
        if (!user?.id) {
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

        // 3. Handle tracking after initialization
        const distinctId = localStorage.getItem("mixpanel_distinct_id");
        localStorage.setItem("mixpanel_user_id", user.id);

        await Promise.all([
          identifyUser(user.id, distinctId || "", user),

          // TODO: only submit to Hubspot on production
          isNewUser ? submitToHubspot(user) : Promise.resolve(),
        ]);

        track("user_logged_in", {
          user_id: user.id,
          distinct_id: distinctId,
        });
      } catch (err) {
        console.error("Error initializing user:", err);
        setIsInitializing(false);
      }
    };

    initUser();
  }, [user]);

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
