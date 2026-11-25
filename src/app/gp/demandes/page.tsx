import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { requests, trips, users } from "@/db/schema";
import { requireGp } from "@/lib/auth";
import { euros, shortDate } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";
import { DecisionForm } from "@/components/RequestForms";
import { currentPrice, pendingOffer } from "@/lib/offer";

export const metadata = { title: "Demandes reçues" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const u = await requireGp();
  const list = await db
    .select({ r: requests, t: trips, clientName: users.name })
    .from(requests)
    .innerJoin(trips, eq(trips.id, requests.tripId))
    .innerJoin(users, eq(users.id, requests.clientId))
    .where(eq(trips.gpId, u.id))
    .orderBy(desc(requests.createdAt));

  const pending = list.filter((x) => x.r.status === "pending");
  const others = list.filter((x) => x.r.status !== "pending");

  return (
    <>
      <h1>Demandes reçues</h1>
      <h2>À traiter ({pending.length})</h2>
      {pending.length === 0 && <p className="tag">Aucune demande en attente.</p>}
      {pending.map(({ r, t, clientName }) => (
        <article className="trip" key={r.id}>
          <p>
            <b>{clientName}</b> · {t.fromCity} → {t.toCity} · départ {shortDate(t.departureDate)}
          </p>
          <div className="note">
            <b>
              {r.weightKg} kg · {r.category} · {euros(r.weightKg * currentPrice(r))}
            </b>
            {r.description || "Pas de description"}
          </div>
          {r.recipientName && (
            <p className="tag">
              À remettre à {r.recipientName} à {t.toCity}
            </p>
          )}
          {(() => {
            const offer = pendingOffer(r);
            return (
              <>
                {offer && (
                  <p className={offer.by === "client" ? "warn" : "tag"}>
                    {offer.by === "client"
                      ? `${clientName} propose ${offer.price} € le kilo (votre prix : ${r.pricePerKg} €). Vous pouvez accepter, refuser ou faire une autre proposition depuis la discussion.`
                      : `Vous avez proposé ${offer.price} € le kilo. En attente de la réponse de ${clientName}.`}
                  </p>
                )}
                <DecisionForm id={r.id} canAccept={offer?.by !== "gp"} acceptLabel={offer ? `Accepter à ${offer.price} €/kg` : undefined} />
              </>
            );
          })()}
          <Link className="btn alt small" href={`/demandes/${r.id}`}>
            Ouvrir la discussion et négocier
          </Link>
        </article>
      ))}
      <h2>Historique ({others.length})</h2>
      {others.length === 0 && <p className="tag">Rien dans l&apos;historique pour l&apos;instant.</p>}
      {others.map(({ r, t, clientName }) => (
        <Link key={r.id} href={`/demandes/${r.id}`} className="trip" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="between">
            <span>
              <StatusPill status={r.status} /> <b>{clientName}</b> · {t.fromCity} → {t.toCity}
            </span>
            <b>
              {r.weightKg} kg · {euros(r.weightKg * r.pricePerKg)}
            </b>
          </div>
          <span className="tag">Départ {shortDate(t.departureDate)}</span>
        </Link>
      ))}
    </>
  );
}
