import { NextResponse, NextRequest } from "next/server";

export const config = {
  matcher: '/((?!_next|api|static|images|favicon.ico|sw.js).*)'
};

export function middleware(request: NextRequest) {
  // Don't protect the password-protect page itself
  if (request.nextUrl.pathname === '/password-protect') {
    return NextResponse.next()
  }

  // Check for verification in cookies instead of localStorage
  const isVerified = request.cookies.get('isVerified')?.value;

  if (!isVerified) {
    return NextResponse.redirect(new URL('/password-protect', request.url))
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", "123");

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
