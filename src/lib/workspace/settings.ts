import type { WorkspaceRole } from "@prisma/client";

import { hasPermission } from "@/lib/auth/authorization";
import type { TenantContext } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

export interface WorkspaceSettingsData {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  actor: {
    userId: string;
    email: string;
    role: WorkspaceRole;
    canInvite: boolean;
    canManageRoles: boolean;
  };
  members: Array<{
    id: string;
    userId: string;
    email: string;
    name: string | null;
    role: WorkspaceRole;
    status: string;
    joinedAt: string;
    isSelf: boolean;
  }>;
  invites: Array<{
    id: string;
    email: string;
    role: WorkspaceRole;
    status: string;
    expiresAt: string;
    invitedBy: string;
  }>;
}

export async function getWorkspaceSettingsData(context: TenantContext): Promise<WorkspaceSettingsData> {
  const workspace = await getPrisma().workspace.findUniqueOrThrow({
    where: { id: context.workspaceId },
    include: {
      members: {
        where: { status: "ACTIVE" },
        include: { user: true },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      },
      invites: {
        where: { status: "PENDING" },
        include: { invitedBy: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
    actor: {
      userId: context.userId,
      email: context.userEmail,
      role: context.role,
      canInvite: hasPermission(context.role, "inviteMembers"),
      canManageRoles: hasPermission(context.role, "manageMemberRoles"),
    },
    members: workspace.members.map((member) => ({
      id: member.id,
      userId: member.userId,
      email: member.user.email,
      name: member.user.name,
      role: member.role,
      status: member.status,
      joinedAt: member.createdAt.toISOString(),
      isSelf: member.userId === context.userId,
    })),
    invites: workspace.invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt.toISOString(),
      invitedBy: invite.invitedBy.email,
    })),
  };
}
