import { cookies, headers } from "next/headers";

import { pendingVerificationCookieName } from "@/lib/auth/constants";
import { shouldUseSecureCookie } from "@/lib/auth/session";

const pendingVerificationMaxAge = 24 * 60 * 60;

export async function setPendingVerificationToken(token: string) {
  const headerStore = await headers();
  const cookieStore = await cookies();

  cookieStore.set(pendingVerificationCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(headerStore.get("x-forwarded-host") ?? headerStore.get("host"), headerStore.get("x-forwarded-proto")),
    path: "/",
    maxAge: pendingVerificationMaxAge,
  });
}

export async function getPendingVerificationToken() {
  const cookieStore = await cookies();

  return cookieStore.get(pendingVerificationCookieName)?.value;
}
