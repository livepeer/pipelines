import { createServerClient } from "@repo/supabase";

interface UpsertStreamParams {
  pipeline_id: string;
  name: string;
  pipeline_params: Record<string, any>;
  is_smoke_test: boolean;
  from_playground: boolean;
}

export async function upsertStream(
  params: UpsertStreamParams,
  userId: string
) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from("streams")
    .upsert({
      pipeline_id: params.pipeline_id,
      name: params.name,
      pipeline_params: params.pipeline_params,
      is_smoke_test: params.is_smoke_test,
      from_playground: params.from_playground,
      author: userId
    })
    .select();

  return { data: data?.[0], error };
} 