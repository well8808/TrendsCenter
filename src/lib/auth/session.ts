import { createHash, randomBytes } from "node:crypto";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { MembershipStatus, UserStatus, WorkspaceRole } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { sessionCookieName } from "@/lib/auth/constants";

const sessionDays = 30;
const sessionMaxAge = sessionDays * 24 * 60 * 60;

export interface TenantContext {
  userId: string;
  userEmail: string;
  userName: string | null;
  userStatus: UserStatus;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  role: WorkspaceRole;
  membershipStatus: MembershipStatus;
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function expiresAt() {
  return new Date(Date.now() + sessionMaxAge * 1000);
}

export async function createAuthSession(userId: string, workspaceId: string) {
  const token = randomBytes(32).toString("base64url");
  const headerStore = await headers();
  const cookieStore = await cookies();

  await getPrisma().authSession.create({
    data: {
      tokenHash: hashSessionToken(token),
      userId,
      workspaceId,
      userAgent: headerStore.get("user-agent"),
      expiresAt: expiresAt(),
    },
  });

  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAge,
  });
}

export async function clearAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    await getPrisma().authSession.deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    });
  }

  cookieStore.delete(sessionCookieName);
}

export async function getTenantContext(): Promise<TenantContext | null> {
  const token = (await cookies()).get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  const session = await getPrisma().authSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: {
      workspace: true,
      user: {
        include: {
          memberships: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date() || session.user.status !== "ACTIVE") {
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
