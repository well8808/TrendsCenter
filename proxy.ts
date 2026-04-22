import { NextResponse, type NextRequest } from "next/server";

import { sessionCookieName } from "@/lib/auth/constants";

const publicPaths = new Set(["/login", "/signup", "/icon.svg"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic =
    publicPaths.has(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|xml)$/);

  if (isPublic) {
    return NextResponse.next();
  }

  const hasSessionCookie = Boolean(request.cookies.get(sessionCookieName)?.value);

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
