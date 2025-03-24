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

  const isNewUser = data?.length === 0;

  if (isNewUser) {
    console.log("user not found, creating");

    const { error } = await supabase.from("users").insert({
      id: user?.id,
      email:
        user?.email?.address ||
        user?.google?.email ||
        user?.discord?.email ||
        (user.discord && `${user?.id}-discord-user@livepeer.org`),
      name:
        user?.google?.name ||
        user?.discord?.username ||
        user.email?.address?.split("@")[0] ||
        (user.discord && `${user?.id}-discord-user`),
      provider: user?.google ? "google" : user?.discord ? "discord" : "email",
    });
    if (error) {
      console.error(error);
    }
  }

  return { isNewUser };
}
