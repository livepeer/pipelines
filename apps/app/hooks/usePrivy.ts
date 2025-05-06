import mixpanel from "mixpanel-browser";
import { usePrivy as _usePrivy, PrivyInterface } from "@privy-io/react-auth";
import { DUMMY_USER_ID_FOR_NON_AUTHENTICATED_USERS } from "./useDreamshaper";
import { useEffect } from "react";
export {
  useLoginWithEmail,
  useLoginWithOAuth,
  type OAuthFlowState,
  type OAuthProviderType,
  type User,
} from "@privy-io/react-auth";

const mockPrivy = {
  authenticated: true,
  ready: true,
  user: {
    id: DUMMY_USER_ID_FOR_NON_AUTHENTICATED_USERS,
    email: { address: "dummy@livepeer.org" },
    createdAt: new Date(),
    isGuest: true,
    linkedAccounts: [],
    mfaMethods: [],
    hasAcceptedTerms: true,
  },
  login: () => {},
  logout: () => {},
};

const shouldMock =
  process.env.NEXT_PUBLIC_USE_PRIVY_MOCK === "true" &&
  process.env.NODE_ENV === "development";

const usePrivyWithMixpanel = () => {
  const privy = _usePrivy();
  const { user, authenticated, ready } = privy;
  const userId = user?.id;

  useEffect(() => {
    if (
      !ready ||
      !authenticated ||
      !userId ||
      userId === DUMMY_USER_ID_FOR_NON_AUTHENTICATED_USERS
    ) {
      return;
    }

    if (
      typeof window === "undefined" ||
      typeof mixpanel.get_distinct_id !== "function"
    ) {
      console.warn("Mixpanel SDK not available yet.");
      return;
    }

    const currentMixpanelId = mixpanel.get_distinct_id();
    const mixpanelAliasProcessedKey = `mixpanel_alias_${userId}`;

    if (userId === currentMixpanelId) {
      console.log(
        `Mixpanel: User ${userId} is already identified. Current distinct_id matches userId.`,
      );

      try {
        if (!localStorage.getItem(mixpanelAliasProcessedKey)) {
          localStorage.setItem(mixpanelAliasProcessedKey, "true");
        }
      } catch (e) {
        console.error(
          "Failed to update localStorage for alias processed key:",
          e,
        );
      }

      return;
    }
    let aliasProcessed = false;
    try {
      aliasProcessed =
        localStorage.getItem(mixpanelAliasProcessedKey) === "true";
    } catch (e) {
      console.error("Failed to read alias status from localStorage:", e);
    }

    if (!aliasProcessed && currentMixpanelId && userId !== currentMixpanelId) {
      mixpanel.alias(userId, currentMixpanelId);
      console.log(
        `Mixpanel Alias: Aliased anonymous ID ${currentMixpanelId} to ${userId}.`,
      );
      try {
        localStorage.setItem(mixpanelAliasProcessedKey, "true");
      } catch (e) {
        console.error("Failed to save alias status to localStorage:", e);
      }
    } else if (aliasProcessed) {
      console.log(
        `Mixpanel: Alias for ${userId} was already processed. Identifying.`,
      );
    }

    mixpanel.identify(userId);
    console.log("Mixpanel Identify: Identified user", userId);

    if (user?.email?.address) {
      mixpanel.people.set({
        $email: user.email.address,
        "Privy User ID": userId,
        "Account Created At": user.createdAt,
      });
      mixpanel.register_once({
        $initial_email: user.email.address,
        "Initial Sign Up Date": new Date().toISOString(),
      });
    }
  }, [userId, authenticated, ready, user]);

  return privy;
};

export const usePrivy = shouldMock
  ? () => mockPrivy as unknown as PrivyInterface
  : usePrivyWithMixpanel;
