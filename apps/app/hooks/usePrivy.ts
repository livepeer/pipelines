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
  const userId = privy?.user?.id;

  useEffect(() => {
    if (userId && userId !== DUMMY_USER_ID_FOR_NON_AUTHENTICATED_USERS) {
      const currentDistinctId = mixpanel.get_distinct_id();

      if (currentDistinctId && userId !== currentDistinctId) {
        mixpanel.alias(userId, currentDistinctId);
        console.log(
          `Mixpanel Alias: Aliased ${currentDistinctId} to ${userId}`,
        );
      }

      mixpanel.identify(userId);
      console.log("Mixpanel Identify: Identified user", userId);
    }
  }, [userId]);

  return privy;
};

export const usePrivy = shouldMock
  ? () => mockPrivy as unknown as PrivyInterface
  : usePrivyWithMixpanel;
