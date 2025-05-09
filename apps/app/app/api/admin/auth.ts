"use server";

import { createServerClient } from "@repo/supabase";
import { NextResponse } from "next/server";

const ADMIN_DOMAIN = "livepeer.org";

/**
 * Verifies that the current session user has an email with the
 * livepeer.org domain, which is required for admin access
 */
export async function verifyAdminAccess(request?: Request) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user?.email?.endsWith(`@${ADMIN_DOMAIN}`)) {
    return {
      authorized: true,
      user: session.user,
    };
  }

  if (request) {
    const privyUser = request.headers.get("x-privy-user");
    if (privyUser) {
      try {
        const userData = JSON.parse(privyUser);
        const email = userData.email?.address;

        if (email && email.endsWith(`@${ADMIN_DOMAIN}`)) {
          return {
            authorized: true,
            user: { email, id: userData.id },
          };
        }
      } catch (e) {
        console.error("Error parsing Privy user data:", e);
      }
    }
  }

  return {
    authorized: false,
    error: `Unauthorized: Admin access restricted to ${ADMIN_DOMAIN} users`,
    status: 403,
  };
}

export async function requireAdminAuth(request?: Request) {
  const auth = await verifyAdminAccess(request);

  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  return NextResponse.json({ user: auth.user });
}
