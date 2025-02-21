"use client";

import { PrivyProvider as PrivyProviderRaw } from "@privy-io/react-auth";
import { useIsMobile } from "../hooks/use-mobile";

const DEFAULT_LOGIN_METHODS = ["discord", "github", "wallet", "email"] as any;

export const PrivyProvider = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();

  const loginMethods = isMobile
    ? DEFAULT_LOGIN_METHODS.filter((method: string) => method !== "email")
    : DEFAULT_LOGIN_METHODS;

  return (
    <PrivyProviderRaw
      appId={"cm2xth5uy0acgf4dk18qfg2vq"}
      config={{
        loginMethods,
        appearance: {
          theme: "dark",
        },
        legal: {
          termsAndConditionsUrl: "https://www.livepeer.org/terms-of-service-p",
          privacyPolicyUrl: "https://www.livepeer.org/privacy-policy-p",
        },
      }}
    >
      {children}
    </PrivyProviderRaw>
  );
};
