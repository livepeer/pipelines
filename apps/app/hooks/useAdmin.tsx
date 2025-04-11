"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePrivy } from "./usePrivy";

type AdminAuthState = {
  isAdmin: boolean;
  isLoading: boolean;
  email?: string;
};

const AdminContext = createContext<AdminAuthState>({
  isAdmin: false,
  isLoading: true,
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, authenticated, ready } = usePrivy();
  const [state, setState] = useState<AdminAuthState>({
    isAdmin: false,
    isLoading: true,
  });

  useEffect(() => {
    // Only check after Privy is fully loaded
    if (!ready) return;

    // Add some delay to ensure Privy has completed initialization
    const timer = setTimeout(() => {
      console.log("[Admin] Auth state:", authenticated);
      console.log("[Admin] User:", user);

      if (!authenticated || !user) {
        setState({ isAdmin: false, isLoading: false });
        return;
      }

      // Check email from all possible sources - using type narrowing
      let email: string | undefined = undefined;

      if (user.email?.address) {
        email = user.email.address;
      } else if (user.google?.email) {
        email = user.google.email;
      } else {
        // Safely check linked accounts using raw access since types aren't matching reality
        const accounts = user.linkedAccounts || [];
        for (const account of accounts) {
          // These are runtime checks that won't trigger TS errors
          if (account && typeof account === "object" && "email" in account) {
            email = account.email as string;
            break;
          }
        }
      }

      console.log("[Admin] Found email:", email);

      if (email && email.endsWith("@livepeer.org")) {
        setState({
          isAdmin: true,
          isLoading: false,
          email,
        });
      } else {
        setState({ isAdmin: false, isLoading: false });
      }
    }, 800); // Slightly longer delay to ensure Privy is fully initialized

    return () => clearTimeout(timer);
  }, [user, authenticated, ready]);

  return (
    <AdminContext.Provider value={state}>{children}</AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
