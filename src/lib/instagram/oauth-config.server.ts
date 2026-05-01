export interface InstagramOAuthConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes: string[];
  ready: boolean;
}

const defaultScopes = ["instagram_business_basic", "instagram_business_manage_insights"];

function parseScopes(value?: string) {
  if (!value) {
    return defaultScopes;
  }

  const scopes = value
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);

  return scopes.length > 0 ? scopes : defaultScopes;
}

export function getInstagramOAuthConfig(): InstagramOAuthConfig {
  const clientId = process.env.INSTAGRAM_CLIENT_ID?.trim() || undefined;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET?.trim() || undefined;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI?.trim() || undefined;
  const scopes = parseScopes(process.env.INSTAGRAM_SCOPES);

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes,
    ready: Boolean(clientId && clientSecret && redirectUri),
  };
}

export function isInstagramOAuthEnabled() {
  return process.env.INSTAGRAM_OAUTH_ENABLED?.trim().toLowerCase() === "true";
}

export function getPublicInstagramOAuthConfig() {
  const config = getInstagramOAuthConfig();

  return {
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    scopes: config.scopes,
    ready: config.ready,
  };
}
