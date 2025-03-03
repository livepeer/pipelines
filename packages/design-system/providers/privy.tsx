"use client";

import { PrivyProvider as PrivyProviderRaw } from "@privy-io/react-auth";

const DEFAULT_LOGIN_METHODS = ["discord", "github", "wallet", "email"] as any;

export const PrivyProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <PrivyProviderRaw
      appId={"cm2xth5uy0acgf4dk18qfg2vq"}
      config={{
        loginMethods: DEFAULT_LOGIN_METHODS,
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
