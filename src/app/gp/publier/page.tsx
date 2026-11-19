import { TripWizard } from "@/components/TripWizard";
import { CITIES } from "@/lib/constants";
import { todayIso } from "@/lib/format";

export const metadata = { title: "Publier un trajet" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ de?: string; vers?: string }> }) {
  const sp = await searchParams;
  const city = (c?: string) => (c && (CITIES as readonly string[]).includes(c) ? c : "");
  const from = city(sp.de);
  const to = city(sp.vers);
  return <TripWizard today={todayIso()} from={from} to={from !== to ? to : ""} />;
}
