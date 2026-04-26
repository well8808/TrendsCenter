"use server";

import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { createAuthSession, clearAuthSession, getTenantContext } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { assertRateLimit, RateLimitError } from "@/lib/auth/rate-limit";
import { formValue, normalizeEmail, writeAuthEvent } from "@/lib/auth/events";
import { createPlainToken, expiresInMinutes, hashIdentifier, hashToken } from "@/lib/auth/tokens";
import { buildActionUrl, getRequestBaseUrl } from "@/lib/auth/url";
import { queueAuthEmail } from "@/lib/auth/outbox";
import { getPendingVerificationToken, setPendingVerificationToken } from "@/lib/auth/pending-verification";
import { getPrisma } from "@/lib/db";
import { provisionWorkspaceBaseline } from "@/lib/tenant/provisioning";

const verificationTtlMinutes = 60 * 24;
const passwordResetTtlMinutes = 45;

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function redirectWithError(path: string, code: string): never {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("error", code);

  redirect(`${pathname}?${params.toString()}`);
}

function redirectVerificationPending(email: string, code = "sent"): never {
  const url = new URL("http://local/verify-pending");
  url.searchParams.set("email", email);
  url.searchParams.set("status", code);

  redirect(`${url.pathname}?${url.searchParams.toString()}`);
}

async function createVerificationToken({
  client,
  userId,
  email,
  workspaceId,
  baseUrl,
}: {
  client: Prisma.TransactionClient;
  userId: string;
  email: string;
  workspaceId?: string;
  baseUrl: string;
}) {
  const token = createPlainToken();
  const actionUrl = buildActionUrl(baseUrl, "/verify-email", token);

  await client.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: expiresInMinutes(verificationTtlMinutes),
    },
  });
  await queueAuthEmail({
    client,
    kind: "EMAIL_VERIFICATION",
    toEmail: email,
    subject: "Verifique seu acesso ao TikTok Market Command Center",
    actionUrl,
    userId,
    workspaceId,
    body: `Confirme este e-mail para liberar o workspace. Link válido por 24 horas: ${actionUrl}`,
  });
  await writeAuthEvent({
    client,
    type: "EMAIL_VERIFICATION_SENT",
    email,
    userId,
    workspaceId,
  });

  return { actionUrl, token };
}

export async function loginAction(formData: FormData) {
  const email = normalizeEmail(formValue(formData, "email"));
  const password = formValue(formData, "password");
  const remember = formValue(formData, "remember") === "on";

  try {
    await assertRateLimit({ bucket: "login", identifier: email || "missing", limit: 8, windowSeconds: 15 * 60 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      redirectWithError("/login", "rate_limited");
    }

    throw error;
  }

  if (!email || !password) {
    redirectWithError("/login", "missing");
  }

  const user = await getPrisma().user.findUnique({
    where: { email },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  const passwordOk = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !passwordOk || user.status === "DISABLED") {
    await writeAuthEvent({
      type: "LOGIN_FAILED",
      success: false,
      email,
      userId: user?.id,
      reason: "invalid_credentials",
    });
    redirectWithError("/login", "invalid");
  }

  if (user.status !== "ACTIVE" || !user.emailVerifiedAt) {
    const baseUrl = await getRequestBaseUrl();
    const verification = await getPrisma().$transaction(async (tx) => {
      await tx.emailVerificationToken.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });

      return createVerificationToken({
        client: tx,
        userId: user.id,
        email,
        workspaceId: user.memberships[0]?.workspaceId,
        baseUrl,
      });
    });

    await setPendingVerificationToken(verification.token);
    await writeAuthEvent({
      type: "LOGIN_BLOCKED",
      success: false,
      email,
      userId: user.id,
      reason: "email_unverified",
    });
    redirectVerificationPending(email, "unverified");
  }

  const membership = user.memberships[0];

  if (!membership) {
    redirectWithError("/login", "workspace");
  }

  await createAuthSession(user.id, membership.workspaceId, { remember });
  await writeAuthEvent({
    type: "LOGIN_SUCCEEDED",
    email,
    userId: user.id,
    workspaceId: membership.workspaceId,
  });
  redirect("/");
}

export async function signupAction(formData: FormData) {
  const email = normalizeEmail(formValue(formData, "email"));
  const name = formValue(formData, "name") || null;
  const workspaceName = formValue(formData, "workspaceName") || "TikTok Market Workspace";
  const password = formValue(formData, "password");

  try {
    await assertRateLimit({ bucket: "signup", identifier: email || "missing", limit: 5, windowSeconds: 60 * 60 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      redirectWithError("/signup", "rate_limited");
    }

    throw error;
  }

  if (!email || !email.includes("@") || password.length < 10) {
    redirectWithError("/signup", "invalid");
  }

  const passwordHash = await hashPassword(password);
  const baseSlug = slugify(workspaceName) || slugify(email.split("@")[0] ?? "workspace") || "workspace";
  const suffix = createPlainToken().replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase();
  const baseUrl = await getRequestBaseUrl();
  let verificationToken: string | undefined;

  try {
    await getPrisma().$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          status: "PENDING_VERIFICATION",
        },
      });
      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          slug: `${baseSlug}-${suffix}`,
        },
      });

      await tx.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: "OWNER",
          status: "ACTIVE",
        },
      });
      await provisionWorkspaceBaseline(tx, {
        workspaceId: workspace.id,
        actor: email,
      });
      const verification = await createVerificationToken({
        client: tx,
        userId: user.id,
        email,
        workspaceId: workspace.id,
        baseUrl,
      });
      verificationToken = verification.token;
      await writeAuthEvent({
        client: tx,
        type: "SIGNUP_CREATED",
        email,
        userId: user.id,
        workspaceId: workspace.id,
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      redirectWithError("/signup", "exists");
    }

    console.error("[signup] failed", error);
    redirectWithError("/signup", "failed");
  }

  if (verificationToken) {
    await setPendingVerificationToken(verificationToken);
  }

  redirectVerificationPending(email);
}

export async function resendVerificationAction(formData: FormData) {
  const email = normalizeEmail(formValue(formData, "email"));
  let verificationToken: string | undefined;

  try {
    await assertRateLimit({
      bucket: "resend-verification",
      identifier: email || "missing",
      limit: 4,
      windowSeconds: 60 * 60,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      redirectVerificationPending(email, "cooldown");
    }

    throw error;
  }

  if (email) {
    const user = await getPrisma().user.findUnique({
      where: { email },
      include: { memberships: { orderBy: { createdAt: "asc" }, take: 1 } },
    });

    if (user && (user.status === "PENDING_VERIFICATION" || !user.emailVerifiedAt)) {
      const baseUrl = await getRequestBaseUrl();
      await getPrisma().$transaction(async (tx) => {
        await tx.emailVerificationToken.updateMany({
          where: { userId: user.id, consumedAt: null },
          data: { consumedAt: new Date() },
        });
        const verification = await createVerificationToken({
          client: tx,
          userId: user.id,
          email,
          workspaceId: user.memberships[0]?.workspaceId,
          baseUrl,
        });
        verificationToken = verification.token;
      });
    }
  }

  if (verificationToken) {
    await setPendingVerificationToken(verificationToken);
  }

  redirectVerificationPending(email, "resent");
}

export async function getPendingVerificationLink(email: string) {
  const token = await getPendingVerificationToken();

  if (!token) {
    return null;
  }

  const record = await getPrisma().emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!record || record.consumedAt || record.expiresAt <= new Date()) {
    return null;
  }

  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail && normalizeEmail(record.user.email) !== normalizedEmail) {
    return null;
  }

  return {
    actionUrl: buildActionUrl(await getRequestBaseUrl(), "/verify-email", token),
    email: record.user.email,
    expiresAt: record.expiresAt,
  };
}

export async function consumeEmailVerificationToken(token: string) {
  const prisma = getPrisma();
  const tokenHash = hashToken(token);
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          memberships: {
            orderBy: { createdAt: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!record || record.consumedAt) {
    await writeAuthEvent({
      type: "EMAIL_VERIFICATION_FAILED",
      success: false,
      reason: "invalid_token",
    });
    return { ok: false, status: "invalid" as const };
  }

  if (record.expiresAt <= new Date()) {
    await writeAuthEvent({
      type: "EMAIL_VERIFICATION_FAILED",
      success: false,
      email: record.user.email,
      userId: record.userId,
      reason: "expired_token",
    });
    return { ok: false, status: "expired" as const, email: record.user.email };
  }

  const workspaceId = record.user.memberships[0]?.workspaceId;

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: {
        status: "ACTIVE",
        emailVerifiedAt: record.user.emailVerifiedAt ?? new Date(),
      },
    }),
    prisma.authEvent.create({
      data: {
        type: "EMAIL_VERIFIED",
        emailHash: hashIdentifier(record.user.email),
        userId: record.userId,
        workspaceId,
      },
    }),
  ]);

  return { ok: true, status: "verified" as const, email: record.user.email };
}

export async function forgotPasswordAction(formData: FormData) {
  const email = normalizeEmail(formValue(formData, "email"));

  try {
    await assertRateLimit({
      bucket: "forgot-password",
      identifier: email || "missing",
      limit: 5,
      windowSeconds: 60 * 60,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      redirect("/forgot-password/sent");
    }

    throw error;
  }

  if (email) {
    const user = await getPrisma().user.findUnique({
      where: { email },
      include: { memberships: { orderBy: { createdAt: "asc" }, take: 1 } },
    });

    if (user?.status === "ACTIVE" && user.emailVerifiedAt) {
      const token = createPlainToken();
      const actionUrl = buildActionUrl(await getRequestBaseUrl(), "/reset-password", token);

      await getPrisma().$transaction(async (tx) => {
        await tx.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: hashToken(token),
            expiresAt: expiresInMinutes(passwordResetTtlMinutes),
          },
        });
        await queueAuthEmail({
          client: tx,
          kind: "PASSWORD_RESET",
          toEmail: email,
          subject: "Redefina sua senha do Command Center",
          actionUrl,
          userId: user.id,
          workspaceId: user.memberships[0]?.workspaceId,
          body: `Use este link para redefinir sua senha. Ele expira em 45 minutos: ${actionUrl}`,
        });
        await writeAuthEvent({
          client: tx,
          type: "PASSWORD_RESET_REQUESTED",
          email,
          userId: user.id,
          workspaceId: user.memberships[0]?.workspaceId,
        });
      });
    } else {
      await writeAuthEvent({
        type: "PASSWORD_RESET_REQUESTED",
        success: true,
        email,
        reason: "suppressed_or_unknown",
      });
    }
  }

  redirect("/forgot-password/sent");
}

export async function resetPasswordAction(formData: FormData) {
  const token = formValue(formData, "token");
  const password = formValue(formData, "password");

  try {
    await assertRateLimit({
      bucket: "reset-password",
      identifier: token ? hashToken(token) : "missing",
      limit: 6,
      windowSeconds: 30 * 60,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      redirectWithError("/reset-password", "rate_limited");
    }

    throw error;
  }

  if (!token || password.length < 10) {
    redirectWithError(`/reset-password?token=${encodeURIComponent(token)}`, "invalid");
  }

  const record = await getPrisma().passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: { memberships: { orderBy: { createdAt: "asc" }, take: 1 } },
      },
    },
  });

  if (!record || record.consumedAt || record.expiresAt <= new Date() || record.user.status !== "ACTIVE") {
    await writeAuthEvent({
      type: "PASSWORD_RESET_FAILED",
      success: false,
      userId: record?.userId,
      reason: "invalid_or_expired",
    });
    redirectWithError("/reset-password", "invalid_token");
  }

  const passwordHash = await hashPassword(password);
  const workspaceId = record.user.memberships[0]?.workspaceId;

  const prisma = getPrisma();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    }),
    prisma.authSession.deleteMany({
      where: { userId: record.userId },
    }),
    prisma.authEvent.create({
      data: {
        type: "PASSWORD_RESET_COMPLETED",
        emailHash: hashIdentifier(record.user.email),
        userId: record.userId,
        workspaceId,
      },
    }),
  ]);

  redirect("/reset-password/success");
}

export async function getPasswordResetTokenState(token: string) {
  if (!token) {
    return { ok: false, status: "invalid" as const };
  }

  const record = await getPrisma().passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { consumedAt: true, expiresAt: true },
  });

  if (!record || record.consumedAt) {
    return { ok: false, status: "invalid" as const };
  }

  if (record.expiresAt <= new Date()) {
    return { ok: false, status: "expired" as const };
  }

  return { ok: true, status: "valid" as const };
}

export async function getInviteTokenState(token: string) {
  if (!token) {
    return { ok: false, status: "invalid" as const };
  }

  const invite = await getPrisma().workspaceInvite.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { workspace: true },
  });

  if (!invite || invite.status !== "PENDING") {
    return { ok: false, status: "invalid" as const };
  }

  if (invite.expiresAt <= new Date()) {
    return { ok: false, status: "expired" as const, email: invite.email, workspaceName: invite.workspace.name };
  }

  return {
    ok: true,
    status: "valid" as const,
    email: invite.email,
    role: invite.role,
    workspaceName: invite.workspace.name,
  };
}

export async function acceptInviteAction(formData: FormData) {
  const token = formValue(formData, "token");
  const name = formValue(formData, "name") || null;
  const password = formValue(formData, "password");

  try {
    await assertRateLimit({
      bucket: "accept-invite",
      identifier: token ? hashToken(token) : "missing",
      limit: 8,
      windowSeconds: 60 * 60,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      redirectWithError(`/invite?token=${encodeURIComponent(token)}`, "rate_limited");
    }

    throw error;
  }

  if (!token || password.length < 10) {
    redirectWithError(`/invite?token=${encodeURIComponent(token)}`, "invalid");
  }

  const invite = await getPrisma().workspaceInvite.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!invite || invite.status !== "PENDING" || invite.expiresAt <= new Date()) {
    await writeAuthEvent({ type: "WORKSPACE_INVITE_FAILED", success: false, reason: "invalid_or_expired" });
    redirectWithError("/invite", "invalid_token");
  }

  const result = await getPrisma().$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({ where: { email: invite.email } });
    let userId = existingUser?.id;

    if (existingUser) {
      if (existingUser.status === "DISABLED" || !(await verifyPassword(password, existingUser.passwordHash))) {
        throw new Error("invalid_credentials");
      }

      await tx.user.update({
        where: { id: existingUser.id },
        data: {
          status: "ACTIVE",
          emailVerifiedAt: existingUser.emailVerifiedAt ?? new Date(),
          name: existingUser.name ?? name,
        },
      });
    } else {
      const user = await tx.user.create({
        data: {
          email: invite.email,
          name,
          passwordHash: await hashPassword(password),
          status: "ACTIVE",
          emailVerifiedAt: new Date(),
        },
      });
      userId = user.id;
    }

    await tx.workspaceMember.upsert({
      where: { userId_workspaceId: { userId: userId!, workspaceId: invite.workspaceId } },
      update: {
        status: "ACTIVE",
        role: invite.role,
      },
      create: {
        userId: userId!,
        workspaceId: invite.workspaceId,
        role: invite.role,
        status: "ACTIVE",
      },
    });
    await tx.workspaceInvite.update({
      where: { id: invite.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        acceptedById: userId,
      },
    });
    await writeAuthEvent({
      client: tx,
      type: "WORKSPACE_INVITE_ACCEPTED",
      email: invite.email,
      userId,
      workspaceId: invite.workspaceId,
    });

    return { userId: userId!, workspaceId: invite.workspaceId };
  }).catch((error) => {
    if (error instanceof Error && error.message === "invalid_credentials") {
      redirectWithError(`/invite?token=${encodeURIComponent(token)}`, "invalid");
    }

    throw error;
  });

  await createAuthSession(result.userId, result.workspaceId);
  redirect("/");
}

export async function logoutAction() {
  const context = await getTenantContext();

  if (context) {
    await writeAuthEvent({
      type: "LOGOUT",
      userId: context.userId,
      workspaceId: context.workspaceId,
    });
  }

  await clearAuthSession();
  redirect("/login");
}
