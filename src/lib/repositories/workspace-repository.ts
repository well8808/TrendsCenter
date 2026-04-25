import type { WorkspaceRole } from "@prisma/client";

import { hasPermission } from "@/lib/auth/authorization";
import { getPrisma } from "@/lib/db";

export async function findWorkspaceById(workspaceId: string) {
  return getPrisma().workspace.findUnique({
    where: { id: workspaceId },
  });
}

export async function findCurrentWorkspaceSnapshot(
  workspaceId: string,
  actor: { role: WorkspaceRole },
) {
  const workspace = await getPrisma().workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    include: {
      members: {
        where: { status: "ACTIVE" },
        include: { user: true },
      },
      invites: {
        where: { status: "PENDING" },
      },
      _count: {
        select: {
          signals: true,
          sources: true,
          videos: true,
          jobRuns: true,
          authEmailOutbox: true,
        },
      },
    },
  });

  return {
    workspace,
    permissions: {
      readWorkspace: hasPermission(actor.role, "readWorkspace"),
      operateSignals: hasPermission(actor.role, "operateSignals"),
      inviteMembers: hasPermission(actor.role, "inviteMembers"),
      manageMemberRoles: hasPermission(actor.role, "manageMemberRoles"),
      manageOwnership: hasPermission(actor.role, "manageOwnership"),
    },
  };
}

export async function findWorkspaceRunContext(workspaceId: string) {
  return getPrisma().workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
}
