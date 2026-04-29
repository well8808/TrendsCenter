import { randomBytes } from "node:crypto";

import type { NextRequest } from "next/server";

import type { ApiTenantContext } from "@/lib/services/auth-context-service";
import { badRequest } from "@/lib/http/errors";

export const instagramOAuthStateCookieName = "tmcc_instagram_oauth_state";
export const instagramOAuthStateMaxAgeSeconds = 10 * 60;
export const instagramOAuthStateCookiePath = "/api/connectors/instagram";

interface InstagramOAuthStatePayload {
  state: string;
  workspaceId: string;
  userId: string;
  createdAt: string;
}

function encodePayload(payload: InstagramOAuthStatePayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string): InstagramOAuthStatePayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<InstagramOAuthStatePayload>;

    if (
      typeof parsed.state !== "string" ||
      typeof parsed.workspaceId !== "string" ||
      typeof parsed.userId !== "string" ||
      typeof parsed.createdAt !== "string"
    ) {
      return null;
    }

    return {
      state: parsed.state,
      workspaceId: parsed.workspaceId,
      userId: parsed.userId,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

export function createInstagramOAuthState(context: Pick<ApiTenantContext, "workspaceId" | "userId">) {
  const state = randomBytes(32).toString("base64url");

  return {
    state,
    cookieValue: encodePayload({
      state,
      workspaceId: context.workspaceId,
      userId: context.userId,
      createdAt: new Date().toISOString(),
    }),
  };
}

export function validateInstagramOAuthState(
  cookieValue: string | undefined,
  returnedState: string | null,
  context: Pick<ApiTenantContext, "workspaceId" | "userId">,
) {
  if (!cookieValue || !returnedState) {
    throw badRequest("State OAuth Instagram ausente ou expirado.");
  }

  const payload = decodePayload(cookieValue);
  const createdAt = payload ? Date.parse(payload.createdAt) : Number.NaN;
  const expired = !Number.isFinite(createdAt) || Date.now() - createdAt > instagramOAuthStateMaxAgeSeconds * 1000;

  if (
    !payload ||
    expired ||
    payload.state !== returnedState ||
    payload.workspaceId !== context.workspaceId ||
    payload.userId !== context.userId
  ) {
    throw badRequest("State OAuth Instagram inválido.");
  }

  return payload;
}

export function shouldUseSecureOAuthCookie(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  const isLocalhost = host.startsWith("127.0.0.1") || host.startsWith("localhost");

  return proto === "https" || Boolean(host && process.env.NODE_ENV === "production" && !isLocalhost);
}
