import { afterEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/lib/http/errors";
import { createInstagramOAuthState, validateInstagramOAuthState } from "@/lib/instagram/oauth-state.server";

import {
  buildInstagramAuthorizationUrl,
  exchangeInstagramAuthorizationCode,
  requireInstagramCallbackCode,
  instagramAuthorizationEndpoint,
  instagramLongLivedTokenEndpoint,
  instagramTokenEndpoint,
} from "./oauth-flow.server";

const oauthConfig = {
  clientId: "client-id",
  clientSecret: "client-secret-value",
  redirectUri: "https://trends.center/api/connectors/instagram/callback",
  scopes: ["instagram_business_basic", "instagram_business_manage_insights"],
  ready: true,
};

const context = {
  userId: "user-1",
  workspaceId: "workspace-1",
};

describe("Instagram OAuth flow", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds the official authorization URL without exposing client secret", () => {
    const url = buildInstagramAuthorizationUrl("csrf-state", oauthConfig);

    expect(url.origin + url.pathname).toBe(instagramAuthorizationEndpoint);
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("redirect_uri")).toBe("https://trends.center/api/connectors/instagram/callback");
    expect(url.searchParams.get("scope")).toBe("instagram_business_basic,instagram_business_manage_insights");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe("csrf-state");
    expect(url.searchParams.get("enable_fb_login")).toBe("0");
    expect(url.searchParams.get("force_authentication")).toBe("1");
    expect(url.toString()).not.toContain("client-secret-value");
  });

  it("fails safely when INSTAGRAM_CLIENT_ID is missing", () => {
    expect(() =>
      buildInstagramAuthorizationUrl("csrf-state", {
        ...oauthConfig,
        clientId: undefined,
        ready: false,
      }),
    ).toThrow(AppError);
  });

  it("fails safely when INSTAGRAM_REDIRECT_URI is missing", () => {
    expect(() =>
      buildInstagramAuthorizationUrl("csrf-state", {
        ...oauthConfig,
        redirectUri: undefined,
        ready: false,
      }),
    ).toThrow(AppError);
  });

  it("rejects an invalid callback state before token exchange", () => {
    const oauthState = createInstagramOAuthState(context);

    expect(() => validateInstagramOAuthState(oauthState.cookieValue, "wrong-state", context)).toThrow(AppError);
  });

  it("rejects callback without code", () => {
    expect(() => requireInstagramCallbackCode(null)).toThrow(AppError);
  });

  it("exchanges code with the official token endpoint using form encoding", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "short-lived-token-value",
            user_id: 123456,
            permissions: "instagram_business_basic,instagram_business_manage_insights",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "long-lived-token-value",
            token_type: "bearer",
            expires_in: 5184000,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const token = await exchangeInstagramAuthorizationCode("auth-code", oauthConfig);
    const [, init] = fetchMock.mock.calls[0];
    const body = init.body as URLSearchParams;

    expect(fetchMock).toHaveBeenCalledWith(
      instagramTokenEndpoint,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/x-www-form-urlencoded",
        }),
      }),
    );
    expect(body.get("client_id")).toBe("client-id");
    expect(body.get("client_secret")).toBe("client-secret-value");
    expect(body.get("code")).toBe("auth-code");
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("redirect_uri")).toBe("https://trends.center/api/connectors/instagram/callback");
    expect(String(fetchMock.mock.calls[1][0])).toContain(instagramLongLivedTokenEndpoint);
    expect(String(fetchMock.mock.calls[1][0])).toContain("grant_type=ig_exchange_token");
    expect(token).toMatchObject({
      accessToken: "long-lived-token-value",
      externalAccountId: "123456",
      scope: "instagram_business_basic,instagram_business_manage_insights",
      tokenType: "bearer",
      expiresIn: 5184000,
    });
  });
});
