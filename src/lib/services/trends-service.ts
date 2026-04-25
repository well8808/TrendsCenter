import type { ApiTenantContext } from "@/lib/services/auth-context-service";
import { getTrendDetail, getTrendSearchData, type TrendMarketFilter, type TrendSearchSort } from "@/lib/trends/search";

export function normalizeTrendSearchParams(input: URLSearchParams) {
  const sort = (input.get("sort") ?? "score").toLowerCase();
  const market = (input.get("market") ?? "ALL").toUpperCase();

  return {
    query: input.get("query")?.trim() ?? input.get("q")?.trim() ?? "",
    sort: (sort === "recency" || sort === "growth" ? sort : "score") as TrendSearchSort,
    market: (market === "BR" || market === "US" ? market : "ALL") as TrendMarketFilter,
  };
}

export async function listTrends(context: ApiTenantContext, input: URLSearchParams) {
  return getTrendSearchData(context, normalizeTrendSearchParams(input));
}

export async function getTrendById(context: ApiTenantContext, id: string) {
  return getTrendDetail(context, id);
}
