import { randomBytes } from "node:crypto";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { MembershipStatus, UserStatus, WorkspaceRole } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { sessionCookieName } from "@/lib/auth/constants";
import { hashToken } from "@/lib/auth/tokens";

const persistentSessionDays = 30;
const persistentSessionMaxAge = persistentSessionDays * 24 * 60 * 60;
const transientSessionHours = 12;
const transientSessionMaxAge = transientSessionHours * 60 * 60;

export interface TenantContext {
  userId: string;
  userEmail: string;
  userName: string | null;
  userStatus: UserStatus;
  emailVerifiedAt: Date;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  role: WorkspaceRole;
  membershipStatus: MembershipStatus;
}

function expiresAt(maxAgeSeconds: number) {
  return new Date(Date.now() + maxAgeSeconds * 1000);
}

export function shouldUseSecureCookie(host: string | null, proto: string | null) {
  const normalizedHost = host ?? "";
  const isLocalHost = normalizedHost.startsWith("127.0.0.1") || normalizedHost.startsWith("localhost");

  return proto === "https" || Boolean(normalizedHost && process.env.NODE_ENV === "production" && !isLocalHost);
}

async function readSessionToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    return token;
  }

  const cookieHeader = (await headers()).get("cookie") ?? "";
  const rawCookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${sessionCookieName}=`));

  return rawCookie ? decodeURIComponent(rawCookie.slice(sessionCookieName.length + 1)) : undefined;
}

export async function createAuthSession(userId: string, workspaceId: string, options: { remember?: boolean } = {}) {
  const remember = options.remember ?? true;
  const maxAge = remember ? persistentSessionMaxAge : transientSessionMaxAge;
  const token = randomBytes(32).toString("base64url");
  const headerStore = await headers();
  const cookieStore = await cookies();

  await getPrisma().authSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      workspaceId,
      userAgent: headerStore.get("user-agent"),
      expiresAt: expiresAt(maxAge),
    },
  });

  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(headerStore.get("x-forwarded-host") ?? headerStore.get("host"), headerStore.get("x-forwarded-proto")),
    path: "/",
    maxAge: remember ? maxAge : undefined,
  });
}

export async function clearAuthSession() {
  const cookieStore = await cookies();
  const token = await readSessionToken();

  if (token) {
    await getPrisma().authSession.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }

  cookieStore.delete(sessionCookieName);
}

export async function getTenantContext(): Promise<TenantContext | null> {
  const token = await readSessionToken();

  if (!token) {
    return null;
  }

  const session = await getPrisma().authSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      workspace: true,
      user: {
        include: {
          memberships: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date() || session.user.status !== "ACTIVE" || !session.user.emailVerifiedAt) {
    if (session) {
      await getPrisma().authSession.deleteMany({ where: { id: session.id } });
    }

    return null;
  }

  const membership = session.user.memberships.find(
    (item) => item.workspaceId === session.workspaceId && item.status === "ACTIVE",
  );

  if (!membership) {
    return null;
  }

  return {
    userId: session.user.id,
    userEmail: session.user.email,
    userName: session.user.name,
    userStatus: session.user.status,
    emailVerifiedAt: session.user.emailVerifiedAt,
    workspaceId: session.workspace.id,
    workspaceName: session.workspace.name,
    workspaceSlug: session.workspace.slug,
    role: membership.role,
    membershipStatus: membership.status,
  };
}

export async function requireTenantContext() {
  const context = await getTenantContext();

  if (!context) {
    redirect("/login");
  }

  return context;
}

export async function requireTenantContextForAction() {
  const context = await getTenantContext();

  if (!context) {
    throw new Error("Sessao obrigatoria. Entre novamente para continuar.");
  }

  return context;
}
