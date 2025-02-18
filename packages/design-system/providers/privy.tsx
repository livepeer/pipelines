"use client";

import { PrivyProvider as PrivyProviderRaw } from "@privy-io/react-auth";

export const PrivyProvider = ({ children }: { children: React.ReactNode }) => (
  <PrivyProviderRaw 
    appId={"cm2xth5uy0acgf4dk18qfg2vq"}
    config={{
      appearance: {
        theme: "dark",
      },
      legal: {
        termsAndConditionsUrl: "/terms",
        privacyPolicyUrl: "/privacy",
      },
    }}
  >
    {children}
  </PrivyProviderRaw>
);
