import type { NextRequest } from "next/server";

import { getPrisma } from "@/lib/db";
import { badRequest } from "@/lib/http/errors";
import { withRouteHandler } from "@/lib/http/route-handler";
import { ok } from "@/lib/http/responses";
import { assertInternalRequest, buildSystemTenantContext } from "@/lib/services/auth-context-service";
import { importProviderReels } from "@/lib/services/reels-provider-import-service";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  return withRouteHandler(request, async (routeContext) => {
    assertInternalRequest(request);

    if (process.env.REELS_AUTOMATION_ENABLED !== "true") {
      return ok(routeContext.requestId, { skipped: true, reason: "REELS_AUTOMATION_ENABLED desativado." });
    }

    const urls = (process.env.REELS_AUTOMATION_PROFILE_URLS ?? "")
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      throw badRequest("REELS_AUTOMATION_PROFILE_URLS precisa ter ao menos um perfil.");
    }

    const workspaceSlug = process.env.REELS_AUTOMATION_WORKSPACE_SLUG?.trim();
    const workspace = workspaceSlug
      ? await getPrisma().workspace.findUnique({ where: { slug: workspaceSlug }, select: { id: true } })
      : await getPrisma().workspace.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });

    if (!workspace) {
      throw badRequest("Nenhum workspace encontrado para automacao.");
    }

    const context = await buildSystemTenantContext(workspace.id, "reels-automation@internal");
    const data = await importProviderReels(context, {
      provider: "bright_data",
      mode: "profile_reels",
      market: process.env.REELS_AUTOMATION_MARKET === "US" ? "US" : "BR",
      urls,
      maxPerProfile: Number(process.env.REELS_AUTOMATION_MAX_PER_PROFILE ?? 10),
      sourceTitle: process.env.REELS_AUTOMATION_SOURCE_TITLE || "Bright Data Reels - automacao",
    });

    return ok(routeContext.requestId, data, 202);
  });
}
