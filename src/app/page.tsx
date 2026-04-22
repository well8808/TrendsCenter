import { CommandCenter } from "@/components/command-center";
import { getCommandCenterData } from "@/lib/persistence/command-center";

export const dynamic = "force-dynamic";

export default async function Home() {
  const commandCenterData = await getCommandCenterData();
  const dataVersion = [
    commandCenterData.persistence.label,
    commandCenterData.signals.map((signal) => `${signal.id}:${signal.saved}:${signal.evidence.length}`).join("|"),
    commandCenterData.ingestionLab.jobs.map((job) => job.id).join("|"),
  ].join("::");

  return <CommandCenter key={dataVersion} {...commandCenterData} />;
}
