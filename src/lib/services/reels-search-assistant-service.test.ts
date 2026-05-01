import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiTenantContext } from "@/lib/services/auth-context-service";

const prismaMock = vi.hoisted(() => ({
  video: {
    findMany: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  getPrisma: () => prismaMock,
}));

import { buildReelsSearchAssistantPlan } from "./reels-search-assistant-service";

const originalEnv = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  REELS_AI_MODEL: process.env.REELS_AI_MODEL,
};

const context: ApiTenantContext = {
  userId: "user-1",
  userEmail: "ops@trends.center",
  userName: "Ops",
  userStatus: "ACTIVE",
  emailVerifiedAt: new Date("2026-04-30T10:00:00.000Z"),
  workspaceId: "workspace-1",
  workspaceName: "Radar BR",
  workspaceSlug: "radar-br",
  role: "OWNER",
  membershipStatus: "ACTIVE",
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

describe("buildReelsSearchAssistantPlan", () => {
  beforeEach(() => {
    prismaMock.video.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    restoreEnv();
  });

  it("uses local rules when OpenAI is not configured", async () => {
    delete process.env.OPENAI_API_KEY;

    const plan = await buildReelsSearchAssistantPlan(context, {
      goal: "quero achar Reels BR crescendo rapido com storytelling",
      market: "BR",
    });

    expect(plan).toMatchObject({
      provider: "rules",
      configured: false,
      market: "BR",
      sort: "growth",
    });
  });

  it("falls back to local rules when OpenAI has no available credits", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "insufficient_quota" } }), {
        status: 429,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const plan = await buildReelsSearchAssistantPlan(context, {
      goal: "quero encontrar criadores pequenos do Brasil ganhando views",
      market: "BR",
    });

    expect(fetchMock).toHaveBeenCalledWith("https://api.openai.com/v1/responses", expect.any(Object));
    expect(plan).toMatchObject({
      provider: "rules",
      configured: false,
      market: "BR",
      sort: "growth",
    });
  });
});
