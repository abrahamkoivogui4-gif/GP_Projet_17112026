import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { ResetForm } from "@/components/ResetForm";

export const metadata = { title: "Mot de passe oublié" };

export default async function Page() {
  if (await getUser()) redirect("/compte");
  return <ResetForm />;
}
