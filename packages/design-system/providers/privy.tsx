"use client";

import { PrivyProvider as PrivyProviderRaw } from "@privy-io/react-auth";

const DEFAULT_LOGIN_METHODS = [
  "discord",
  "github",
  "wallet",
  "email",
  "google",
] as any;
const DEFAULT_PRIVY_APP_ID = "cm2xth5uy0acgf4dk18qfg2vq"; // Production App ID

export const PrivyProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <PrivyProviderRaw
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? DEFAULT_PRIVY_APP_ID}
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
