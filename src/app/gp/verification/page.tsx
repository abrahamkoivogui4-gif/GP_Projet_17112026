import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { verificationDocs } from "@/db/schema";
import { requireGp } from "@/lib/auth";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { VerificationForm } from "@/components/VerificationForm";

export const metadata = { title: "Badge GP vérifié" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const u = await requireGp();
  const last = await db.query.verificationDocs.findFirst({
    where: eq(verificationDocs.userId, u.id),
    orderBy: desc(verificationDocs.createdAt),
  });

  return (
    <div className="card accent">
      <VerifiedBadge size={56} />
      <h1>Badge GP vérifié</h1>
      {u.verification === "verified" ? (
        <p>Votre identité est vérifiée. Le badge s&apos;affiche à côté de votre nom sur tous vos trajets.</p>
      ) : u.verification === "pending" ? (
        <p>Votre pièce d&apos;identité est en cours de contrôle par l&apos;équipe. Le badge apparaîtra sur tous vos trajets dès validation.</p>
      ) : (
        <>
          {u.verification === "refused" && (
            <div className="note bad">
              <b>Vérification refusée</b>
              {last?.adminNote || "La pièce n'était pas lisible ou ne correspondait pas à votre nom. Vous pouvez en renvoyer une."}
            </div>
          )}
          <p>
            Ce badge montre aux clients que l&apos;équipe a contrôlé votre identité. Envoyez une photo nette de votre carte d&apos;identité, de votre passeport ou de
            votre titre de séjour, au nom de <b>{u.name}</b>.
          </p>
          <ul className="tag" style={{ margin: 0, paddingLeft: 20 }}>
            <li>Photo nette, les 4 coins visibles, pas de reflet.</li>
            <li>JPG, PNG ou PDF, 5 Mo maximum.</li>
            <li>Votre pièce n&apos;est vue que par l&apos;équipe et elle est supprimée après le contrôle.</li>
          </ul>
          <VerificationForm />
        </>
      )}
    </div>
  );
}
