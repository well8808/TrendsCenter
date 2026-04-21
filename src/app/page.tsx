import { CommandCenter } from "@/components/command-center";
import { getCommandCenterData } from "@/lib/persistence/command-center";

export const dynamic = "force-dynamic";

export default async function Home() {
  const commandCenterData = await getCommandCenterData();

  return <CommandCenter {...commandCenterData} />;
}
