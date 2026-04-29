import { afterEach, describe, expect, it } from "vitest";

import { getPublicInstagramOAuthConfig, getInstagramOAuthConfig } from "./oauth-config.server";

const originalEnv = {
  INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID,
  INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET,
  INSTAGRAM_REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI,
  INSTAGRAM_SCOPES: process.env.INSTAGRAM_SCOPES,
};

function restoreEnv() {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (typeof value === "undefined") {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe("Instagram OAuth config", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("stays optional when Instagram OAuth env vars are absent", () => {
    delete process.env.INSTAGRAM_CLIENT_ID;
    delete process.env.INSTAGRAM_CLIENT_SECRET;
    delete process.env.INSTAGRAM_REDIRECT_URI;
    delete process.env.INSTAGRAM_SCOPES;

    expect(getInstagramOAuthConfig()).toEqual({
      clientId: undefined,
      clientSecret: undefined,
      redirectUri: undefined,
      scopes: ["instagram_business_basic", "instagram_business_manage_insights"],
      ready: false,
    });
  });

  it("does not expose the client secret through the public config", () => {
    process.env.INSTAGRAM_CLIENT_ID = "client-id";
    process.env.INSTAGRAM_CLIENT_SECRET = "client-secret";
    process.env.INSTAGRAM_REDIRECT_URI = "https://example.com/api/connectors/instagram/callback";
    process.env.INSTAGRAM_SCOPES = "instagram_business_basic,instagram_business_manage_insights";

    expect(getPublicInstagramOAuthConfig()).toEqual({
      clientId: "client-id",
      redirectUri: "https://example.com/api/connectors/instagram/callback",
      scopes: ["instagram_business_basic", "instagram_business_manage_insights"],
      ready: true,
    });
    expect(JSON.stringify(getPublicInstagramOAuthConfig())).not.toContain("client-secret");
  });
});
