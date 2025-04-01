import {
  OAuthFlowState,
  OAuthProviderType,
  useLoginWithEmail,
  useLoginWithOAuth,
} from "@/hooks/usePrivy";
import { createContext, useContext, useMemo } from "react";

export const AuthContext = createContext<{
  sendCode: ({ email }: { email: string }) => Promise<void>;
  oAuthState: OAuthFlowState;
  initOAuth: ({ provider }: { provider: OAuthProviderType }) => Promise<void>;
}>({
  sendCode: async () => {},
  oAuthState: {
    status: "initial",
  },
  initOAuth: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { sendCode } = useLoginWithEmail();
  const { state, initOAuth } = useLoginWithOAuth();
  const value = useMemo(
    () => ({ sendCode, oAuthState: state, initOAuth }),
    [sendCode, state, initOAuth],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
