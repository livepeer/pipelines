import { NextResponse, NextRequest } from "next/server";
import { compareSync } from "bcrypt-edge";
import { createAdminServerClient } from "@repo/supabase";

export const config = {
  matcher: "/api/:path*",
};

export async function middleware(request: NextRequest) {
  // if (
  //   request.nextUrl.pathname.includes("/api/streams/webhook") ||
  //   request.nextUrl.pathname.includes("/api/mixpanel")
  // ) {
  //   return NextResponse.next();
  // }

  // the exported onfig.matcher did not work with negating patterns so this was added here.
  // Purpose: If request is to the /api/streams/${streamId}/status endpoint, we don't need to check for API key.
  // This URL is intended as a public endpoint so that the client can poll for stream status without needing an API key
  // const streamStatusRegex = /^\/api\/streams\/[^\/]+\/status$/;
  // if (streamStatusRegex.test(request.nextUrl.pathname)) {
  //   return NextResponse.next();
  // }

  // const apiKey = request.headers.get("x-api-key");

  // const supabase = await createAdminServerClient();

  // if (!apiKey) {
  //   return NextResponse.json(
  //     { message: "API key is missing" },
  //     { status: 401 }
  //   );
  // }

  // const { data: apiKeyRecord, error } = await supabase
  //   .from("api_keys")
  //   .select("user_id, api_key")
  //   .eq("is_active", true);

  // console.log(apiKeyRecord);

  // if (error || apiKeyRecord.length === 0) {
  //   return NextResponse.json(
  //     { message: "The API doesn't not invalid" },
  //     { status: 403 }
  //   );
  // }

  // let isValid = false;
  // let userId = null;

  // for (const keyRecord of apiKeyRecord) {
  //   isValid = compareSync(apiKey, keyRecord.api_key);
  //   if (isValid) {
  //     userId = keyRecord.user_id;
  //     break;
  //   }
  // }

  // if (!isValid) {
  //   return NextResponse.json({ message: "Invalid API key" }, { status: 403 });
  // }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", "123");

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
