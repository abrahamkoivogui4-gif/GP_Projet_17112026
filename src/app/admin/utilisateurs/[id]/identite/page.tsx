import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { identityRecords, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { dateTime, todayIso } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { purgeOldIdentities, sameName } from "@/lib/identity";
import { deleteIdentity } from "@/app/admin-actions";
import { IdentityForm } from "@/components/IdentityForm";
import { SubmitButton } from "@/components/SubmitButton";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export const metadata = { title: "Pièce d'identité" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  await purgeOldIdentities();
  const id = Number((await params).id) || 0;
  const u = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!u) notFound();
  const rec = await db.query.identityRecords.findFirst({ where: eq(identityRecords.userId, id) });
  const checker = rec?.checkedBy ? await db.query.users.findFirst({ where: eq(users.id, rec.checkedBy), columns: { name: true } }) : null;
  const expired = rec?.expiresOn && rec.expiresOn < todayIso();

  return (
    <>
      <Link href="/admin/utilisateurs" className="link">
        ← Utilisateurs
      </Link>
      <h1>Pièce d&apos;identité</h1>
      <div className="card">
        <div>
          <b>{u.name}</b> {u.verification === "verified" && <VerifiedBadge />}
          <br />
          <span className="tag">
            {u.deletedAt ? `Compte supprimé le ${dateTime(u.deletedAt)}` : formatPhone(u.phone)} · {u.role === "admin" ? "Admin" : u.role === "gp" ? "GP" : "Client"}
          </span>
        </div>
        {rec ? (
          <p className="tag">
            Fiche remplie le {dateTime(rec.checkedAt)}
            {checker ? ` par ${checker.name}` : ""}
            {rec.updatedAt.getTime() - rec.checkedAt.getTime() > 1000 ? ` · modifiée le ${dateTime(rec.updatedAt)}` : ""}.
          </p>
        ) : (
          <p className="tag">Pas encore de fiche pour ce compte.</p>
        )}
        {rec && !u.deletedAt && !sameName(rec.fullName, u.name) && (
          <p className="warn">
            Le nom de la pièce (« {rec.fullName} ») ne correspond pas exactement au nom du compte (« {u.name} »). Vérifiez qu&apos;il s&apos;agit bien de
            la même personne.
          </p>
        )}
        {expired && <p className="err">Pièce expirée depuis le {new Date(rec!.expiresOn! + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.</p>}
      </div>

      <IdentityForm
        key={rec?.updatedAt.toISOString() ?? "new"}
        userId={u.id}
        rec={rec ? { fullName: rec.fullName, birthDate: rec.birthDate, docType: rec.docType, country: rec.country, docNumber: rec.docNumber, expiresOn: rec.expiresOn, note: rec.note } : null}
        suggestedName={u.deletedAt ? "" : u.name}
      />

      {rec && (
        <form action={deleteIdentity}>
          <input type="hidden" name="userId" value={u.id} />
          <SubmitButton className="btn no small" pendingText="Suppression…">
            Supprimer cette fiche
          </SubmitButton>
        </form>
      )}
      <p className="hint">
        Ces informations ne sont visibles que par l&apos;équipe Lilalink. Elles servent en cas de litige ou de fraude. Ne conservez jamais la photo de la
        pièce ailleurs.
      </p>
    </>
  );
}
