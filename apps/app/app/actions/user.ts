"use server";

import { User } from "@/hooks/usePrivy";
import { createServerClient } from "@repo/supabase";

export async function updateUserAdditionalDetails(
  user: User,
  newDetails: Record<string, any>,
) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user?.id)
    .single();

  if (!data) {
    console.error("updateUserAdditionalDetails: User not found");
    return { success: false };
  }

  const { error } = await supabase
    .from("users")
    .update({
      additional_details: { ...data.additional_details, ...newDetails },
    })
    .eq("id", user?.id);

  if (error) {
    console.error(error);
    return { success: false };
  }

  return { success: true };
}

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
  let userData = data?.[0];

  if (isNewUser) {
    console.log("user not found, creating");

    const newUser = {
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
      additional_details: {
        next_onboarding_step: "persona",
        personas: [],
        custom_persona: "",
      },
    };

    const { data: createdUser, error } = await supabase
      .from("users")
      .insert(newUser)
      .select()
      .single();

    if (error) {
      console.error(error);
    } else {
      userData = createdUser;
    }
  }

  return { isNewUser, user: userData };
}

export async function updateUserNameAndDetails(
  user: User,
  name: string,
  newDetails: Record<string, any>,
) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user?.id)
    .single();

  if (!data) {
    console.error("updateUserNameAndDetails: User not found");
    return { success: false };
  }

  const { error } = await supabase
    .from("users")
    .update({
      name: name,
      additional_details: { ...data.additional_details, ...newDetails },
    })
    .eq("id", user?.id);

  if (error) {
    console.error(error);
    return { success: false };
  }

  return { success: true };
}
