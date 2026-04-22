import type { WorkspaceRole } from "@prisma/client";

import type { TenantContext } from "@/lib/auth/session";

export type WorkspacePermission =
  | "readWorkspace"
  | "operateSignals"
  | "inviteMembers"
  | "manageMemberRoles"
  | "manageOwnership";

const permissions: Record<WorkspaceRole, WorkspacePermission[]> = {
  OWNER: ["readWorkspace", "operateSignals", "inviteMembers", "manageMemberRoles", "manageOwnership"],
  ADMIN: ["readWorkspace", "operateSignals", "inviteMembers"],
  MEMBER: ["readWorkspace", "operateSignals"],
};

export function hasPermission(role: WorkspaceRole, permission: WorkspacePermission) {
  return permissions[role]?.includes(permission) ?? false;
}

export function requirePermission(context: TenantContext, permission: WorkspacePermission) {
  if (!hasPermission(context.role, permission)) {
    throw new Error("Acao nao autorizada para o seu papel neste workspace.");
  }
}

export function canInviteRole(actorRole: WorkspaceRole, inviteRole: WorkspaceRole) {
  if (actorRole === "OWNER") {
    return inviteRole === "ADMIN" || inviteRole === "MEMBER";
  }

  if (actorRole === "ADMIN") {
    return inviteRole === "MEMBER";
  }

  return false;
}
