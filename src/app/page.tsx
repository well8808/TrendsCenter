import { CommandCenter } from "@/components/command-center";
import { requireTenantContext } from "@/lib/auth/session";
import { getCommandCenterData } from "@/lib/persistence/command-center";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tenantContext = await requireTenantContext();
  const commandCenterData = await getCommandCenterData(tenantContext);

  const dataVersion = [
    commandCenterData.persistence.label,
    commandCenterData.tenant.workspaceSlug,
    commandCenterData.signals.map((signal) => `${signal.id}:${signal.saved}:${signal.evidence.length}`).join("|"),
    commandCenterData.trendSources.map((source) => `${source.id}:${source.status}:${source.updatedAt}`).join("|"),
  ].join("::");

  return <CommandCenter key={dataVersion} {...commandCenterData} />;
}
