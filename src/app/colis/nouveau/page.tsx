import { requireUser } from "@/lib/auth";
import { CITIES } from "@/lib/constants";
import { todayIso } from "@/lib/format";
import { ParcelForm } from "@/components/ParcelForm";

export const metadata = { title: "Envoyer un colis" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ de?: string; vers?: string }> }) {
  const sp = await searchParams;
  const city = (c?: string) => (c && (CITIES as readonly string[]).includes(c) ? c : "");
  const q = new URLSearchParams();
  if (city(sp.de)) q.set("de", city(sp.de));
  if (city(sp.vers)) q.set("vers", city(sp.vers));
  await requireUser(`/colis/nouveau${q.size ? `?${q}` : ""}`);
  return <ParcelForm from={city(sp.de)} to={city(sp.vers)} today={todayIso()} />;
}
