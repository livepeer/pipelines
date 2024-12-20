"use server"

import { createServerClient } from "@repo/supabase";

export async function fetchPipelines(query: string) {
  const supabase = await createServerClient();
  try {
    const { data, error } = await supabase
      .from("pipelines")
      .select("*")
      .ilike("name", `%${query}%`);

    if (error) {
      console.error("Error fetching pipelines:", error);
      return [];
    }

    return data;
  } catch (error) {
    console.error("Unexpected error fetching pipelines:", error);
    return [];
  }
}


export async function fetchFeaturedPipelines(limit: number = 3) {
  const supabase = await createServerClient();
  try {
    const { data, error } = await supabase
      .from("pipelines")
      .select("*")
      .eq("is_featured", true)
      .limit(limit);

    if (error) {
      console.error("Error fetching featured pipelines:", error);
      return [];
    }

    return data;
  } catch (error) {
    console.error("Unexpected error fetching pipelines:", error);
    return [];
  }
}
