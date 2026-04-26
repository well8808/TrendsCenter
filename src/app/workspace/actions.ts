"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { WorkspaceRole } from "@prisma/client";

import { canInviteRole, requirePermission } from "@/lib/auth/authorization";
import { formValue, normalizeEmail, writeAuthEvent } from "@/lib/auth/events";
import { assertRateLimit, RateLimitError } from "@/lib/auth/rate-limit";
import { requireTenantContextForAction } from "@/lib/auth/session";
import { createPlainToken, expiresInMinutes, hashToken } from "@/lib/auth/tokens";
import { buildActionUrl, getRequestBaseUrl } from "@/lib/auth/url";
import { queueAuthEmail } from "@/lib/auth/outbox";
import { getPrisma } from "@/lib/db";

const inviteTtlMinutes = 60 * 24 * 7;
const assignableRoles: WorkspaceRole[] = ["ADMIN", "MEMBER"];

function workspaceRedirect(code: "status" | "error", value: string): never {
  redirect(`/workspace?${code}=${encodeURIComponent(value)}`);
}

export async function inviteMemberAction(formData: FormData) {
  const context = await requireTenantContextForAction();
  requirePermission(context, "inviteMembers");

  const email = normalizeEmail(formValue(formData, "email"));
  const role = formValue(formData, "role") as WorkspaceRole;

  try {
    await assertRateLimit({
      bucket: "invite-member",
      identifier: `${context.workspaceId}:${context.userId}:${email}`,
      limit: 10,
      windowSeconds: 60 * 60,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      workspaceRedirect("error", "rate_limited");
    }

    throw error;
  }

  if (!email.includes("@") || !assignableRoles.includes(role) || !canInviteRole(context.role, role)) {
    workspaceRedirect("error", "invite_invalid");
  }

  const prisma = getPrisma();
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { memberships: { where: { workspaceId: context.workspaceId, status: "ACTIVE" } } },
  });

  if (existingUser?.memberships.length) {
    workspaceRedirect("error", "already_member");
  }

  const token = createPlainToken();
  const actionUrl = buildActionUrl(await getRequestBaseUrl(), "/invite", token);

  await prisma.$transaction(async (tx) => {
    await tx.workspaceInvite.updateMany({
      where: { workspaceId: context.workspaceId, email, status: "PENDING" },
      data: { status: "REVOKED", revokedAt: new Date() },
    });
    const invite = await tx.workspaceInvite.create({
      data: {
        workspaceId: context.workspaceId,
        email,
        role,
        tokenHash: hashToken(token),
        invitedById: context.userId,
        expiresAt: expiresInMinutes(inviteTtlMinutes),
      },
    });

    await queueAuthEmail({
      client: tx,
      kind: "WORKSPACE_INVITE",
      toEmail: email,
      subject: `Convite para ${context.workspaceName}`,
      actionUrl,
      workspaceId: context.workspaceId,
      body: `Você foi convidado para ${context.workspaceName} como ${role.toLowerCase()}. Link válido por 7 dias: ${actionUrl}`,
    });
    await writeAuthEvent({
      client: tx,
      type: "WORKSPACE_INVITE_SENT",
      email,
      actorUserId: context.userId,
      workspaceId: context.workspaceId,
      metadata: { role, inviteId: invite.id },
    });
  });

  revalidatePath("/workspace");
  workspaceRedirect("status", "invite_sent");
}

export async function changeMemberRoleAction(formData: FormData) {
  const context = await requireTenantContextForAction();
  requirePermission(context, "manageMemberRoles");

  const memberId = formValue(formData, "memberId");
  const role = formValue(formData, "role") as WorkspaceRole;

  if (!assignableRoles.includes(role)) {
    workspaceRedirect("error", "role_invalid");
  }

  const prisma = getPrisma();
  const member = await prisma.workspaceMember.findFirst({
    where: { id: memberId, workspaceId: context.workspaceId, status: "ACTIVE" },
    include: { user: true },
  });

  if (!member || member.userId === context.userId || member.role === "OWNER") {
    workspaceRedirect("error", "role_blocked");
  }

  await prisma.$transaction([
    prisma.workspaceMember.update({
      where: { id: member.id },
      data: { role },
    }),
    prisma.authEvent.create({
      data: {
        type: "MEMBER_ROLE_CHANGED",
        workspaceId: context.workspaceId,
        userId: member.userId,
        actorUserId: context.userId,
        emailHash: undefined,
        metadata: {
          previousRole: member.role,
          nextRole: role,
        },
      },
    }),
  ]);

  revalidatePath("/workspace");
  workspaceRedirect("status", "role_updated");
}
