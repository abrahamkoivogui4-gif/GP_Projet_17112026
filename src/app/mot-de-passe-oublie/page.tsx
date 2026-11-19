import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AuthBrand } from "@/components/AuthForm";
import { ResetForm } from "@/components/ResetForm";

export const metadata = { title: "Mot de passe oublié" };

export default async function Page() {
  if (await getUser()) redirect("/compte");
  return (
    <div className="auth">
      <AuthBrand />
      <div className="auth-box">
        <ResetForm />
      </div>
    </div>
  );
}
