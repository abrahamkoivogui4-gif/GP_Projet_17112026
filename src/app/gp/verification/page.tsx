import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, verificationDocs } from "@/db/schema";
import { requireGp } from "@/lib/auth";
import { VerificationForm } from "@/components/VerificationForm";
import { VerificationSteps } from "@/components/VerificationSteps";

export const metadata = { title: "Badge GP vérifié" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const u = await requireGp();
  const [last, me] = await Promise.all([
    db.query.verificationDocs.findFirst({ where: eq(verificationDocs.userId, u.id), orderBy: desc(verificationDocs.createdAt) }),
    db.query.users.findFirst({ where: eq(users.id, u.id), columns: { verification: true } }),
  ]);
  const status = me?.verification ?? u.verification;
  const canSend = status === "none" || status === "refused";

  return (
    <>
      <h1>Badge GP vérifié</h1>
      <VerificationSteps status={status} sentAt={last?.createdAt ?? null} decidedAt={last?.decidedAt ?? null} adminNote={last?.adminNote ?? ""} />
      {canSend && (
        <div className="card">
          <h2>{status === "refused" ? "Renvoyer une pièce" : "Envoyer ma pièce d'identité"}</h2>
          <p>
            Carte d&apos;identité, passeport ou titre de séjour, au nom de <b>{u.name}</b>.
          </p>
          <ul className="tag" style={{ margin: 0, paddingLeft: 20 }}>
            <li>Photo nette, les 4 coins visibles, pas de reflet.</li>
            <li>JPG, PNG ou PDF, 5 Mo maximum.</li>
            <li>Votre pièce n&apos;est vue que par l&apos;équipe et elle est supprimée après le contrôle.</li>
          </ul>
          <VerificationForm />
        </div>
      )}
    </>
  );
}
