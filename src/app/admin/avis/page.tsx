import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { reviews, users } from "@/db/schema";
import { dateTime } from "@/lib/format";
import { deleteReview } from "@/app/admin-actions";
import { Stars } from "@/components/Stars";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata = { title: "Avis" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const gp = alias(users, "gp");
  const client = alias(users, "client");
  const rows = await db
    .select({ r: reviews, gpName: gp.name, clientName: client.name })
    .from(reviews)
    .innerJoin(gp, eq(gp.id, reviews.gpId))
    .innerJoin(client, eq(client.id, reviews.clientId))
    .orderBy(desc(reviews.createdAt))
    .limit(300);
  return (
    <div className="card">
      <h1>Avis ({rows.length})</h1>
      {rows.length === 0 && <p className="tag">Aucun avis.</p>}
      {rows.map(({ r, gpName, clientName }) => (
        <div className="arow" key={r.id}>
          <div>
            <Stars value={r.stars} /> <b>{clientName}</b> sur {gpName}
            <small>
              {r.comment || "Sans commentaire"} · {dateTime(r.createdAt)}
            </small>
          </div>
          <form action={deleteReview}>
            <input type="hidden" name="id" value={r.id} />
            <SubmitButton className="btn no small">Supprimer</SubmitButton>
          </form>
        </div>
      ))}
    </div>
  );
}
