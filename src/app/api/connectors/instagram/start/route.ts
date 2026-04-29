import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildInstagramAuthorizationUrl } from "@/lib/instagram/oauth-flow.server";
import {
  createInstagramOAuthState,
  instagramOAuthStateCookieName,
  instagramOAuthStateCookiePath,
  instagramOAuthStateMaxAgeSeconds,
  shouldUseSecureOAuthCookie,
} from "@/lib/instagram/oauth-state.server";
import { serviceUnavailable } from "@/lib/http/errors";
import { withRouteHandler } from "@/lib/http/route-handler";
import { isOAuthTokenEncryptionConfigured } from "@/lib/oauth/secret-crypto.server";
import { requireApiTenantContext } from "@/lib/services/auth-context-service";

export async function GET(request: NextRequest) {
  return withRouteHandler(request, async () => {
    const context = await requireApiTenantContext(request, "operateSignals");

    if (!isOAuthTokenEncryptionConfigured()) {
      throw serviceUnavailable("OAUTH_TOKEN_ENCRYPTION_KEY nao configurado para persistir tokens Instagram.");
    }

    const oauthState = createInstagramOAuthState(context);
    const response = NextResponse.redirect(buildInstagramAuthorizationUrl(oauthState.state));

    response.cookies.set(instagramOAuthStateCookieName, oauthState.cookieValue, {
      httpOnly: true,
      maxAge: instagramOAuthStateMaxAgeSeconds,
      path: instagramOAuthStateCookiePath,
      sameSite: "lax",
      secure: shouldUseSecureOAuthCookie(request),
    });

    return response;
  });
}
