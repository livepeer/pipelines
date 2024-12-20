"use server";

import { User } from "@privy-io/react-auth";
import { createServerClient } from "@repo/supabase";

export async function createUser(user: User) {
    //  check if the user exists in supabase, if not, create them
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user?.id);

    if (error) {
      console.error(error);
    }

    if (data?.length === 0) {
      console.log("user not found, creating");

      const { error } = await supabase.from("users").insert({
        id: user?.id,
        email: user?.email,
        name: user?.github?.name || user?.discord?.username,
        provider: user?.github ? "github" : "discord",
      });
      if (error) {
        console.error(error);
      }
    }
}
