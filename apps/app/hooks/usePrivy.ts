import { usePrivy as _usePrivy, PrivyInterface } from "@privy-io/react-auth";
import { DUMMY_USER_ID_FOR_NON_AUTHENTICATED_USERS } from "./useDreamshaper";
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

const shouldMock = true;

export const usePrivy = shouldMock
  ? () => mockPrivy as unknown as PrivyInterface
  : _usePrivy;
