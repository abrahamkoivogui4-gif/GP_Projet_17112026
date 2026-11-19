import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Connexion" };

export default async function Page({ searchParams }: { searchParams: Promise<{ suite?: string; ajout?: string }> }) {
  const { suite, ajout } = await searchParams;
  // « Ajouter un compte » (menu du profil) : on peut se connecter à un 2e compte sans quitter le premier.
  const adding = ajout === "1";
  if (!adding && (await getUser())) redirect(suite?.startsWith("/") && !suite.startsWith("//") ? suite : "/");
  return <AuthForm mode="login" next={suite} adding={adding} />;
}
