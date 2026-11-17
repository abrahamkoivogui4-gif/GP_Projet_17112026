import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Connexion" };

export default async function Page({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const { suite } = await searchParams;
  if (await getUser()) redirect(suite?.startsWith("/") && !suite.startsWith("//") ? suite : "/");
  return <AuthForm mode="login" next={suite} />;
}
