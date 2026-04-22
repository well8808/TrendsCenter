"use server";

import { randomBytes } from "node:crypto";

import { redirect } from "next/navigation";

import { createAuthSession, clearAuthSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getPrisma } from "@/lib/db";
import { provisionWorkspaceBaseline } from "@/lib/tenant/provisioning";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

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

function authError(path: "/login" | "/signup", code: string): never {
  redirect(`${path}?error=${encodeURIComponent(code)}`);
}

export async function loginAction(formData: FormData) {
  const email = normalizeEmail(formValue(formData, "email"));
  const password = formValue(formData, "password");

  if (!email || !password) {
    authError("/login", "missing");
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

  if (!user) {
    authError("/login", "invalid");
  }

  if (user.status !== "ACTIVE" || !(await verifyPassword(password, user.passwordHash))) {
    authError("/login", "invalid");
  }

  const membership = user.memberships[0];

  if (!membership) {
    authError("/login", "workspace");
  }

  await createAuthSession(user.id, membership.workspaceId);
  redirect("/");
}

export async function signupAction(formData: FormData) {
  const email = normalizeEmail(formValue(formData, "email"));
  const name = formValue(formData, "name") || null;
  const workspaceName = formValue(formData, "workspaceName") || "TikTok Market Workspace";
  const password = formValue(formData, "password");

  if (!email || !email.includes("@") || password.length < 10) {
    authError("/signup", "invalid");
  }

  const passwordHash = await hashPassword(password);
  const baseSlug = slugify(workspaceName) || slugify(email.split("@")[0] ?? "workspace") || "workspace";
  const suffix = randomBytes(4).toString("hex");

  try {
    const result = await getPrisma().$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
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

      return { userId: user.id, workspaceId: workspace.id };
    });

    await createAuthSession(result.userId, result.workspaceId);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      authError("/signup", "exists");
    }

    authError("/signup", "failed");
  }

  redirect("/");
}

export async function logoutAction() {
  await clearAuthSession();
  redirect("/login");
}
