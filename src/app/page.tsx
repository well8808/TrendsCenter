import { CommandCenter } from "@/components/command-center";
import type { JobRunsListDto } from "@/lib/api";
import { requireTenantContext } from "@/lib/auth/session";
import { getCommandCenterData } from "@/lib/persistence/command-center";
import { listWorkspaceJobRuns } from "@/lib/services/jobs-service";

export const dynamic = "force-dynamic";

function jobRunsUpdatedAt(data: JobRunsListDto) {
  return data.items.reduce((latest, job) => Math.max(latest, Date.parse(job.updatedAt)), 0) || undefined;
}

export default async function Home() {
  const tenantContext = await requireTenantContext();
  const [commandCenterData, initialJobRuns] = await Promise.all([
    getCommandCenterData(tenantContext),
    listWorkspaceJobRuns(tenantContext, new URLSearchParams({ limit: "12" })).catch<JobRunsListDto>(() => ({ items: [] })),
  ]);
  const initialJobRunsFetchedAt = jobRunsUpdatedAt(initialJobRuns);

  const dataVersion = [
    commandCenterData.persistence.label,
    commandCenterData.tenant.workspaceSlug,
    commandCenterData.signals.map((signal) => `${signal.id}:${signal.saved}:${signal.evidence.length}`).join("|"),
    commandCenterData.trendSources.map((source) => `${source.id}:${source.status}:${source.updatedAt}`).join("|"),
  ].join("::");

  return (
    <CommandCenter
      key={dataVersion}
      {...commandCenterData}
      initialJobRuns={initialJobRuns}
      initialJobRunsFetchedAt={initialJobRunsFetchedAt}
    />
  );
}
