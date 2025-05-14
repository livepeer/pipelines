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
import { ClipRecordingMode } from "@/hooks/useVideoClip";

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
  const { isGuestUser, setIsGuestUser, setLastPrompt } = useGuestUserStore();
  const searchParams = useSearchParams();
  const inputPrompt = searchParams.get("inputPrompt");
  const sourceClipId = searchParams.get("sourceClipId");
  const [isHomepageGuestMode, setIsHomepageGuestMode] = useState(false);
  const [defaultPrompt, setDefaultPrompt] = useState<string | null>(null);

  // Check for homepage guest mode on initial render
  useEffect(() => {
    if (typeof window !== "undefined") {
      const homepageGuestMode =
        localStorage.getItem("daydream_homepage_guest_mode") === "true";
      const savedDefaultPrompt = localStorage.getItem(
        "daydream_default_prompt",
      );

      if (homepageGuestMode) {
        setIsHomepageGuestMode(true);
        if (savedDefaultPrompt) {
          setDefaultPrompt(savedDefaultPrompt);
          setLastPrompt(savedDefaultPrompt);
        }
      }
    }
  }, []);

  // Clear the homepage guest mode flag after it's been used
  useEffect(() => {
    if (isHomepageGuestMode && !authenticated && ready) {
      localStorage.removeItem("daydream_homepage_guest_mode");
    }
  }, [isHomepageGuestMode, authenticated, ready]);

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

  // If guest access is allowed and input prompt exists, enable guest mode
  useEffect(() => {
    if ((allowGuestAccess && inputPrompt) || isHomepageGuestMode) {
      if (!user && ready) {
        setIsGuestUser(true);
      }
    }
  }, [
    allowGuestAccess,
    inputPrompt,
    user,
    setIsGuestUser,
    isHomepageGuestMode,
    ready,
  ]);

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

  // If in guest mode and coming from "Try this prompt" or homepage, allow access to create page
  if (isGuestUser && (inputPrompt || isHomepageGuestMode) && ready) {
    return (
      <OnboardProvider
        hasSharedPrompt={
          hasSharedPrompt || !!inputPrompt || isHomepageGuestMode
        }
      >
        <DaydreamRenderer
          isGuestMode={true}
          defaultPrompt={defaultPrompt || undefined}
        />
      </OnboardProvider>
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
    <OnboardProvider hasSharedPrompt={hasSharedPrompt || !!inputPrompt}>
      <DaydreamRenderer isGuestMode={false} />
    </OnboardProvider>
  );
}

function DaydreamRenderer({
  isGuestMode = false,
  defaultPrompt,
}: {
  isGuestMode?: boolean;
  defaultPrompt?: string | null;
}) {
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
  const searchParams = useSearchParams();
  const inputPrompt = searchParams.get("inputPrompt");
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
  const [pendingClipRecordingMode, setPendingClipRecordingMode] =
    useState<ClipRecordingMode>();

  useEffect(() => {
    // For guest mode, skip directly to main experience
    if (isGuestMode) {
      setCurrentStep("main");
      setIsInitializing(false);
      track("guest_mode_started", {
        is_authenticated: false,
        from_homepage: !!defaultPrompt,
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
          track("user_from_guest_experience", {
            user_id: user.id,
          });
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
            const { blob, filename, thumbnail, prompt, recordingMode } =
              clipData;
            const blobUrl = URL.createObjectURL(blob);
            const thumbnailUrl = URL.createObjectURL(thumbnail);

            setPendingClipUrl(blobUrl);
            setPendingClipFilename(filename);
            setPendingClipThumbnailUrl(thumbnailUrl);
            setPendingClipPrompt(prompt);
            setPendingClipRecordingMode(recordingMode);
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

  // Handle WelcomeScreen and MainExperience components
  let content = null;
  if (isInitializing || currentStep !== "main") {
    content = <WelcomeScreen />;
  } else {
    content = (
      <MainExperience isGuestMode={isGuestMode} defaultPrompt={defaultPrompt} />
    );
  }

  return (
    <>
      {content}
      {showPendingClipModal && (
        <ClipModal
          isOpen={showPendingClipModal}
          onClose={handleClosePendingClipModal}
          clipUrl={pendingClipUrl}
          clipFilename={pendingClipFilename}
          thumbnailUrl={pendingClipThumbnailUrl}
          lastSubmittedPrompt={pendingClipPrompt}
          recordingMode={pendingClipRecordingMode}
        />
      )}
    </>
  );
}
