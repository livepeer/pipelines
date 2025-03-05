import { createServerClient as createServerClientSB } from "@supabase/ssr";
import { cookies } from "next/headers";
import { serverConfig } from "../../apps/app/lib/serverEnv";

export async function createServerClient() {
  const cookieStore = await cookies();

  const { supabase } = await serverConfig();

  return createServerClientSB(supabase.url!, supabase.anonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {}
      },
    },
  });
}
