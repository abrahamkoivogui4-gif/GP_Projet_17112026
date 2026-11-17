import { TripWizard } from "@/components/TripWizard";
import { todayIso } from "@/lib/format";

export const metadata = { title: "Publier un trajet" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <TripWizard today={todayIso()} />;
}
