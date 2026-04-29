import { badRequest, serviceUnavailable } from "@/lib/http/errors";
import { getInstagramOAuthConfig, type InstagramOAuthConfig } from "@/lib/instagram/oauth-config.server";

export const instagramAuthorizationEndpoint = "https://www.instagram.com/oauth/authorize";
export const instagramTokenEndpoint = "https://api.instagram.com/oauth/access_token";
export const instagramLongLivedTokenEndpoint = "https://graph.instagram.com/access_token";
export const instagramRefreshTokenEndpoint = "https://graph.instagram.com/refresh_access_token";

export interface InstagramTokenResponse {
  accessToken: string;
  refreshToken?: string;
  externalAccountId: string;
  scope: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn?: number;
}

interface ShortLivedInstagramToken {
  accessToken: string;
  externalAccountId: string;
  permissions?: string;
}

function requiredConfig(config: InstagramOAuthConfig = getInstagramOAuthConfig()) {
  if (!config.clientId) {
    throw serviceUnavailable("INSTAGRAM_CLIENT_ID nao configurado para iniciar OAuth Instagram.");
  }

  if (!config.redirectUri) {
    throw serviceUnavailable("INSTAGRAM_REDIRECT_URI nao configurado para iniciar OAuth Instagram.");
  }

  if (!config.clientSecret) {
    throw serviceUnavailable("Credencial server-side Instagram nao configurada para concluir OAuth.");
  }

  return {
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
    scopes: config.scopes,
  };
}

export function buildInstagramAuthorizationUrl(state: string, config: InstagramOAuthConfig = getInstagramOAuthConfig()) {
  const oauthConfig = requiredConfig(config);
  const url = new URL(instagramAuthorizationEndpoint);

  url.searchParams.set("enable_fb_login", "0");
  url.searchParams.set("force_authentication", "1");
  url.searchParams.set("client_id", oauthConfig.clientId);
  url.searchParams.set("scope", oauthConfig.scopes.join(","));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", oauthConfig.redirectUri);
  url.searchParams.set("state", state);

  return url;
}

function parseShortLivedInstagramTokenResponse(body: unknown): ShortLivedInstagramToken {
  if (!body || typeof body !== "object") {
    throw serviceUnavailable("Resposta OAuth Instagram invalida.");
  }

  const data = body as Record<string, unknown>;

  if (typeof data.access_token !== "string" || typeof data.user_id !== "number") {
    throw serviceUnavailable("Resposta OAuth Instagram incompleta.");
  }

  return {
    accessToken: data.access_token,
    externalAccountId: String(data.user_id),
    permissions: typeof data.permissions === "string" ? data.permissions : undefined,
  };
}

function parseLongLivedInstagramTokenResponse(
  body: unknown,
  fallback: Pick<InstagramTokenResponse, "externalAccountId" | "scope">,
): InstagramTokenResponse {
  if (!body || typeof body !== "object") {
    throw serviceUnavailable("Resposta de token long-lived Instagram invalida.");
  }

  const data = body as Record<string, unknown>;

  if (typeof data.access_token !== "string" || typeof data.expires_in !== "number") {
    throw serviceUnavailable("Resposta de token long-lived Instagram incompleta.");
  }

  return {
    accessToken: data.access_token,
    externalAccountId: fallback.externalAccountId,
    scope: fallback.scope,
    tokenType: typeof data.token_type === "string" ? data.token_type : "Bearer",
    expiresIn: data.expires_in,
  };
}

export function requireInstagramCallbackCode(code: string | null) {
  if (!code) {
    throw badRequest("Codigo OAuth Instagram ausente.");
  }

  return code;
}

export async function exchangeInstagramAuthorizationCode(
  code: string,
  config: InstagramOAuthConfig = getInstagramOAuthConfig(),
) {
  const oauthConfig = requiredConfig(config);
  const body = new URLSearchParams({
    client_id: oauthConfig.clientId,
    client_secret: oauthConfig.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: oauthConfig.redirectUri,
  });
  const response = await fetch(instagramTokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body,
  });

  if (!response.ok) {
    throw serviceUnavailable("Falha segura ao trocar codigo OAuth Instagram por token.");
  }

  const shortLivedToken = parseShortLivedInstagramTokenResponse(await response.json());
  const longLivedUrl = new URL(instagramLongLivedTokenEndpoint);

  longLivedUrl.searchParams.set("grant_type", "ig_exchange_token");
  longLivedUrl.searchParams.set("client_secret", oauthConfig.clientSecret);
  longLivedUrl.searchParams.set("access_token", shortLivedToken.accessToken);

  const longLivedResponse = await fetch(longLivedUrl, {
    headers: {
      "Cache-Control": "no-cache",
    },
  });

  if (!longLivedResponse.ok) {
    throw serviceUnavailable("Falha segura ao trocar token Instagram por token long-lived.");
  }

  return parseLongLivedInstagramTokenResponse(await longLivedResponse.json(), {
    externalAccountId: shortLivedToken.externalAccountId,
    scope: shortLivedToken.permissions ?? oauthConfig.scopes.join(","),
  });
}
