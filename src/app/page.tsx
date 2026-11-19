import { getUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";
import { TripSearch, type SP } from "@/components/TripSearch";

export const dynamic = "force-dynamic";

/**
 * Page d'accueil comme celle de Facebook :
 * sans compte, on arrive directement sur la connexion (logo et accroche, formulaire, « Créer un nouveau compte ») ;
 * une fois connecté, on arrive sur la recherche de trajets.
 */
export default async function Home({ searchParams }: { searchParams: Promise<SP> }) {
  const [sp, user] = await Promise.all([searchParams, getUser()]);
  if (!user) return <AuthForm mode="login" home />;
  return <TripSearch sp={sp} base="/" />;
}
