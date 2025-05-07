"use client";

import LoginScreen from "./LoginScreen";
import WelcomeScreen from "./WelcomeScreen";
import { OnboardProvider, useOnboard } from "./OnboardContext";
import { Loader2 } from "lucide-react";
import MainExperience from "./MainExperience";
import { useEffect, useState } from "react";
import LayoutWrapper from "./LayoutWrapper";
import { AuthProvider } from "./LoginScreen/AuthContext";
import { createUser } from "@/app/actions/user";
import { handleDistinctId, identifyUser } from "@/lib/analytics/mixpanel";
import { submitToHubspot } from "@/lib/analytics/hubspot";
import track from "@/lib/track";
import { usePrivy } from "@/hooks/usePrivy";
import { useGuestUserStore } from "@/hooks/useGuestUser";
import { useSearchParams } from "next/navigation";
import { ClipModal } from "./Clipping/ClipModal";
import { retrieveClip, deleteClip } from "@/lib/clipStorage";
import { setSourceClipIdToCookies } from "./Clipping/actions";

interface DaydreamProps {
  hasSharedPrompt: boolean;
  isOAuthSuccessRedirect: boolean;
  allowGuestAccess?: boolean;
}

export default function Daydream({
  hasSharedPrompt,
  isOAuthSuccessRedirect,
  allowGuestAccess = false,
}: DaydreamProps) {
  const { user, ready, authenticated } = usePrivy();
  const { isGuestUser, setIsGuestUser } = useGuestUserStore();
  const searchParams = useSearchParams();
  const inputPrompt = searchParams.get("inputPrompt");
  const sourceClipId = searchParams.get("sourceClipId");

  // Used to track the source clip id for remix count
  useEffect(() => {
    if (sourceClipId) {
      const clipId = atob(sourceClipId);
      setSourceClipIdToCookies(clipId);
    }
  }, []);

  // Always reset guest mode if user is authenticated
  useEffect(() => {
    if (authenticated && user && isGuestUser && ready) {
      setIsGuestUser(false);
    }
  }, [authenticated, user, isGuestUser, setIsGuestUser]);

  // If guest access is allowed, enable guest mode
  useEffect(() => {
    if (allowGuestAccess && inputPrompt && !user && ready) {
      setIsGuestUser(true);
    }
  }, [allowGuestAccess, user, inputPrompt, setIsGuestUser]);

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

  // If in guest mode, allow access to create page
  if (isGuestUser && inputPrompt && ready) {
    return (
      <OnboardProvider hasSharedPrompt={hasSharedPrompt || !!inputPrompt}>
        <DaydreamRenderer isGuestMode={true} />
      </OnboardProvider>
    );
  }

  // Catchall - if the user is not logged in, show the login screen
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
    <OnboardProvider hasSharedPrompt={hasSharedPrompt || !!inputPrompt}>
      <DaydreamRenderer isGuestMode={false} />
    </OnboardProvider>
  );
}

function DaydreamRenderer({ isGuestMode = false }: { isGuestMode?: boolean }) {
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
  const [isFromGuestExperience, setIsFromGuestExperience] = useState(false);
  const [pendingClipUrl, setPendingClipUrl] = useState<string | null>(null);
  const [pendingClipFilename, setPendingClipFilename] = useState<string | null>(
    null,
  );
  const [pendingClipThumbnailUrl, setPendingClipThumbnailUrl] = useState<
    string | null
  >(null);
  const [pendingClipPrompt, setPendingClipPrompt] = useState<string | null>(
    null,
  );
  const [showPendingClipModal, setShowPendingClipModal] = useState(false);

  useEffect(() => {
    // For guest mode, skip directly to main experience
    if (isGuestMode) {
      setCurrentStep("main");
      setIsInitializing(false);
      track("guest_mode_started", {
        is_authenticated: false,
      });
      return;
    }

    const initUser = async () => {
      try {
        if (!user?.id) {
          return;
        }

        const fromGuestExperience =
          localStorage.getItem("daydream_from_guest_experience") === "true";

        setIsFromGuestExperience(fromGuestExperience);

        // 1. Create or fetch the user from DB
        const {
          isNewUser,
          user: { additional_details },
        } = await createUser(user);

        const distinctId = handleDistinctId();
        localStorage.setItem("mixpanel_user_id", user.id);

        await Promise.all([
          identifyUser(user.id, distinctId || "", user),

          isNewUser ? submitToHubspot(user) : Promise.resolve(),
        ]);

        if (isNewUser) {
          track("user_account_created", {
            user_id: user.id,
            distinct_id: distinctId,
          });
        }

        track("user_logged_in", {
          user_id: user.id,
          distinct_id: distinctId,
        });

        if (fromGuestExperience) {
          setCurrentStep("persona");
          setIsInitializing(false);

          track("user_from_guest_experience", {
            user_id: user.id,
          });

          return;
        }

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
      } catch (err) {
        console.error("Error initializing user:", err);
        setIsInitializing(false);
      }
    };

    initUser();
  }, [user, isGuestMode]);

  useEffect(() => {
    if (currentStep === "main" && isFromGuestExperience) {
      localStorage.removeItem("daydream_from_guest_experience");
      setIsFromGuestExperience(false);

      retrieveClip()
        .then(clipData => {
          if (clipData) {
            const { blob, filename, thumbnail, prompt } = clipData;
            const blobUrl = URL.createObjectURL(blob);
            const thumbnailUrl = URL.createObjectURL(thumbnail);

            setPendingClipUrl(blobUrl);
            setPendingClipFilename(filename);
            setPendingClipThumbnailUrl(thumbnailUrl);
            setPendingClipPrompt(prompt);
            setShowPendingClipModal(true);

            deleteClip().catch(err => {
              console.error("Error deleting clip from IndexedDB:", err);
            });
          }
        })
        .catch(error => {
          console.error("Error retrieving clip from IndexedDB:", error);
        });
    }
  }, [currentStep, isFromGuestExperience]);

  const handleClosePendingClipModal = () => {
    setShowPendingClipModal(false);
    if (pendingClipUrl) {
      URL.revokeObjectURL(pendingClipUrl);
      setPendingClipUrl(null);
      setPendingClipFilename(null);
    }
    if (pendingClipThumbnailUrl) {
      URL.revokeObjectURL(pendingClipThumbnailUrl);
      setPendingClipThumbnailUrl(null);
    }
    setPendingClipPrompt(null);
  };

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
      <WelcomeScreen simplified={isFromGuestExperience} />
      {["main", "prompt"].includes(currentStep) && (
        <MainExperience isGuestMode={isGuestMode} />
      )}
      {showPendingClipModal && (
        <ClipModal
          isOpen={showPendingClipModal}
          onClose={handleClosePendingClipModal}
          clipUrl={pendingClipUrl}
          clipFilename={pendingClipFilename}
          thumbnailUrl={pendingClipThumbnailUrl}
          lastSubmittedPrompt={pendingClipPrompt}
        />
      )}
    </>
  );
}
