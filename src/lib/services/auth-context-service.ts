import type { NextRequest } from "next/server";
import type { MembershipStatus, UserStatus, WorkspaceRole } from "@prisma/client";

import { hasPermission, type WorkspacePermission } from "@/lib/auth/authorization";
import { sessionCookieName } from "@/lib/auth/constants";
import { forbidden, serviceUnavailable, unauthorized } from "@/lib/http/errors";
import { deleteSessionById, findTenantSessionByRawToken } from "@/lib/repositories/session-repository";
import { findWorkspaceRunContext } from "@/lib/repositories/workspace-repository";

export interface ApiTenantContext {
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

function readTokenFromRequest(request: NextRequest) {
  const fromCookie = request.cookies.get(sessionCookieName)?.value;

  if (fromCookie) {
    return fromCookie;
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const rawCookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${sessionCookieName}=`));

  return rawCookie ? decodeURIComponent(rawCookie.slice(sessionCookieName.length + 1)) : undefined;
}

export async function requireApiTenantContext(request: NextRequest, permission?: WorkspacePermission) {
  const token = readTokenFromRequest(request);

  if (!token) {
    throw unauthorized();
  }

  const session = await findTenantSessionByRawToken(token);

  if (!session || session.expiresAt <= new Date() || session.user.status !== "ACTIVE" || !session.user.emailVerifiedAt) {
    if (session) {
      await deleteSessionById(session.id);
    }

    throw unauthorized("Sessão inválida ou expirada.");
  }

  const membership = session.user.memberships.find(
    (item) => item.workspaceId === session.workspaceId && item.status === "ACTIVE",
  );

  if (!membership) {
    throw unauthorized("Workspace indisponível para esta sessão.");
  }

  if (permission && !hasPermission(membership.role, permission)) {
    throw forbidden();
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
  } satisfies ApiTenantContext;
}

function internalSecrets() {
  return [process.env.INTERNAL_API_TOKEN, process.env.CRON_SECRET].filter(
    (secret): secret is string => typeof secret === "string" && secret.length > 0,
  );
}

export function assertInternalRequest(request: NextRequest) {
  const secrets = internalSecrets();

  if (secrets.length === 0) {
    throw serviceUnavailable("INTERNAL_API_TOKEN ou CRON_SECRET não configurado.");
  }

  const authorization = request.headers.get("authorization");

  if (!secrets.some((secret) => authorization === `Bearer ${secret}`)) {
    throw unauthorized("Internal token inválido.");
  }
}

export async function buildSystemTenantContext(workspaceId: string, actor = "system@internal") {
  const workspace = await findWorkspaceRunContext(workspaceId);

  if (!workspace) {
    throw unauthorized("Workspace não encontrado para execução interna.");
  }

  return {
    userId: `system:${workspace.id}`,
    userEmail: actor,
    userName: "System Worker",
    userStatus: "ACTIVE" as UserStatus,
    emailVerifiedAt: new Date(),
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    workspaceSlug: workspace.slug,
    role: "OWNER" as WorkspaceRole,
    membershipStatus: "ACTIVE" as MembershipStatus,
  } satisfies ApiTenantContext;
}
