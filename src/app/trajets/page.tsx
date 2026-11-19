import { TripSearch, type SP } from "@/components/TripSearch";

export const dynamic = "force-dynamic";
export const metadata = { title: "Trajets" };

/** Recherche de trajets accessible sans compte (lien « Voir les trajets » de la page d'accueil). */
export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  return <TripSearch sp={await searchParams} base="/trajets" />;
}
