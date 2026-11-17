import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, verificationDocs } from "@/db/schema";
import { dateTime } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { decideVerification } from "@/app/admin-actions";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata = { title: "Vérifications" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const rows = await db
    .select({ d: verificationDocs, name: users.name, phone: users.phone })
    .from(verificationDocs)
    .innerJoin(users, eq(users.id, verificationDocs.userId))
    .orderBy(desc(verificationDocs.createdAt))
    .limit(100);
  const pending = rows.filter((r) => r.d.status === "pending");
  const done = rows.filter((r) => r.d.status !== "pending");

  return (
    <>
      <h1>Vérifications d&apos;identité ({pending.length})</h1>
      <p className="info">Vérifiez que le nom sur la pièce correspond au compte et que la photo est nette. La pièce est supprimée du serveur dès votre décision.</p>
      {pending.length === 0 && <p className="tag">Rien à vérifier.</p>}
      {pending.map(({ d, name, phone }) => (
        <div className="card" key={d.id}>
          <div>
            <b>{name}</b> · {formatPhone(phone)}
            <br />
            <span className="tag">Envoyée le {dateTime(d.createdAt)}</span>
          </div>
          <a className="btn alt small" href={`/admin/verifications/${d.id}/fichier`} target="_blank" rel="noopener">
            Voir la pièce d&apos;identité
          </a>
          <form action={decideVerification} className="field" style={{ gap: 10 }}>
            <input type="hidden" name="id" value={d.id} />
            <textarea name="note" maxLength={300} placeholder="Message pour le GP en cas de refus (ex. photo floue, nom différent)" />
            <div className="row">
              <SubmitButton name="decision" value="approve">
                Valider
              </SubmitButton>
              <SubmitButton name="decision" value="refuse" className="btn no">
                Refuser
              </SubmitButton>
            </div>
          </form>
        </div>
      ))}
      {done.length > 0 && (
        <div className="card">
          <h3>Déjà traitées</h3>
          {done.map(({ d, name }) => (
            <div className="arow" key={d.id}>
              <div>
                <b>{name}</b>
                <small>
                  {d.status === "approved" ? "Validée" : "Refusée"}
                  {d.decidedAt ? ` le ${dateTime(d.decidedAt)}` : ""}
                  {d.adminNote ? ` · ${d.adminNote}` : ""}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
