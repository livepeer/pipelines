import { NextResponse, NextRequest } from "next/server";
import { compareSync } from "bcrypt-edge";
import { createAdminServerClient } from "@repo/supabase";

export const config = {
  matcher: ["/api/:path*", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);

  // Add pathname to headers
  requestHeaders.set("x-pathname", pathname);

  // API middleware logic
  if (pathname.startsWith("/api/")) {
    requestHeaders.set("x-user-id", "123");
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
