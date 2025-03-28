import { usePrivy as _usePrivy, PrivyInterface } from "@privy-io/react-auth";
import { DUMMY_USER_ID_FOR_NON_AUTHENTICATED_USERS } from "./useDreamshaper";

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
};

export const usePrivy = () => {
  const mock = mockPrivy as unknown as PrivyInterface;
  const real = _usePrivy();

  const shouldMock =
    process.env.NEXT_PUBLIC_USE_PRIVY_MOCK === "true" &&
    process.env.NODE_ENV === "development";

  return shouldMock ? mock : real;
};
