import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Créer un compte" };

export default async function Page({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const { suite } = await searchParams;
  if (await getUser()) redirect(suite?.startsWith("/") && !suite.startsWith("//") ? suite : "/");
  return <AuthForm mode="register" next={suite} />;
}
