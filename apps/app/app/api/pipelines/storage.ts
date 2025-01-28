"use server";

import { createServerClient } from "@repo/supabase/server";

function getPublicUrl(fullPath: string) {
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${fullPath}`;
}

export async function uploadFile({
  bucket,
  file,
  fileName,
  operation,
}: {
  bucket: string;
  file: File;
  fileName: string;
  operation: "create" | "edit";
}) {
  const supabase = await createServerClient();

  const result = await supabase.storage.from(bucket).upload(fileName, file, {
    upsert: operation === "edit" ? true : false,
  });

  if (!result || result.error) {
    console.error(result ? result.error : "Upload failed");
    throw new Error("Upload failed");
  }

  const { fullPath } = result.data;
  return getPublicUrl(fullPath);
}
