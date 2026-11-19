import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Créer un compte" };

export default async function Page({ searchParams }: { searchParams: Promise<{ suite?: string; ajout?: string }> }) {
  const { suite, ajout } = await searchParams;
  const adding = ajout === "1";
  if (!adding && (await getUser())) redirect(suite?.startsWith("/") && !suite.startsWith("//") ? suite : "/");
  return <AuthForm mode="register" next={suite} adding={adding} />;
}
