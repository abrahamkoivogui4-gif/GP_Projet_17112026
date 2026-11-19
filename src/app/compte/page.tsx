import { eq } from "drizzle-orm";
import { becomeGp, logout } from "@/app/auth-actions";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatPhone } from "@/lib/phone";
import { PasswordForm } from "@/components/PasswordForm";
import { RecoveryForm } from "@/components/RecoveryForm";
import { SubmitButton } from "@/components/SubmitButton";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export const metadata = { title: "Mon compte" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ devenir?: string }> }) {
  const u = await requireUser("/compte");
  const { devenir } = await searchParams;
  const row = await db.query.users.findFirst({ where: eq(users.id, u.id), columns: { recoveryHash: true } });
  return (
    <>
      <div className="card">
        <h1>
          {u.name} {u.verification === "verified" && <VerifiedBadge size={22} />}
        </h1>
        <dl className="recap">
          <dt>Téléphone</dt>
          <dd>{formatPhone(u.phone)}</dd>
          <dt>Profil</dt>
          <dd>{u.role === "admin" ? "Administrateur" : u.role === "gp" ? "GP" : "Client"}</dd>
        </dl>
        <form action={logout}>
          <SubmitButton className="btn alt">Se déconnecter</SubmitButton>
        </form>
      </div>
      {u.role === "client" && (
        <form action={becomeGp} className={`card${devenir ? " accent" : ""}`}>
          <h2>Vous voyagez ? Devenez GP</h2>
          <p>Publiez vos trajets et recevez des demandes de colis. Vous pourrez toujours envoyer des colis avec le même compte.</p>
          <SubmitButton>Activer mon espace GP</SubmitButton>
        </form>
      )}
      <PasswordForm />
      <RecoveryForm hasCode={!!row?.recoveryHash} />
    </>
  );
}
