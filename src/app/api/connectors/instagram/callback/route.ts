import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { exchangeInstagramAuthorizationCode, requireInstagramCallbackCode } from "@/lib/instagram/oauth-flow.server";
import {
  instagramOAuthStateCookieName,
  instagramOAuthStateCookiePath,
  validateInstagramOAuthState,
} from "@/lib/instagram/oauth-state.server";
import { markInstagramOAuthConnectionError, saveInstagramOAuthConnection } from "@/lib/instagram/oauth-connections.server";
import { withRouteHandler } from "@/lib/http/route-handler";
import { requireApiTenantContext } from "@/lib/services/auth-context-service";

function redirectToSources(request: NextRequest, status: "connected" | "error") {
  const url = new URL("/sources", request.nextUrl.origin);

  url.searchParams.set("instagram", status);

  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  return withRouteHandler(request, async () => {
    const context = await requireApiTenantContext(request, "operateSignals");
    const stateCookie = request.cookies.get(instagramOAuthStateCookieName)?.value;
    const returnedState = request.nextUrl.searchParams.get("state");
    const code = requireInstagramCallbackCode(request.nextUrl.searchParams.get("code"));

    validateInstagramOAuthState(stateCookie, returnedState, context);

    try {
      const token = await exchangeInstagramAuthorizationCode(code);

      await saveInstagramOAuthConnection(context, token);

      const response = redirectToSources(request, "connected");
      response.cookies.delete({
        name: instagramOAuthStateCookieName,
        path: instagramOAuthStateCookiePath,
      });

      return response;
    } catch (error) {
      await markInstagramOAuthConnectionError(
        context,
        error instanceof Error ? error.message : "Falha desconhecida no OAuth Instagram.",
      );

      const response = redirectToSources(request, "error");
      response.cookies.delete({
        name: instagramOAuthStateCookieName,
        path: instagramOAuthStateCookiePath,
      });

      return response;
    }
  });
}
