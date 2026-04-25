import type { ApiTenantContext } from "@/lib/services/auth-context-service";
import { findCurrentWorkspaceSnapshot } from "@/lib/repositories/workspace-repository";

export async function getCurrentWorkspace(context: ApiTenantContext) {
  const snapshot = await findCurrentWorkspaceSnapshot(context.workspaceId, {
    role: context.role,
  });

  return {
    id: snapshot.workspace.id,
    name: snapshot.workspace.name,
    slug: snapshot.workspace.slug,
    createdAt: snapshot.workspace.createdAt.toISOString(),
    updatedAt: snapshot.workspace.updatedAt.toISOString(),
    actor: {
      userId: context.userId,
      email: context.userEmail,
      name: context.userName,
      role: context.role,
      membershipStatus: context.membershipStatus,
    },
    permissions: snapshot.permissions,
    stats: {
      members: snapshot.workspace.members.length,
      pendingInvites: snapshot.workspace.invites.length,
      signals: snapshot.workspace._count.signals,
      sources: snapshot.workspace._count.sources,
      videos: snapshot.workspace._count.videos,
      jobRuns: snapshot.workspace._count.jobRuns,
      outboxItems: snapshot.workspace._count.authEmailOutbox,
    },
  };
}
