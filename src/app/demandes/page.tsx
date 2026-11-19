import Link from "next/link";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { parcelOffers, parcels, requests, trips, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { euros, shortDate, todayIso } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";
import { TripRoute } from "@/components/TripCard";

export const metadata = { title: "Mes demandes" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const u = await requireUser("/demandes");
  const list = await db
    .select({ r: requests, t: trips, gpName: users.name })
    .from(requests)
    .innerJoin(trips, eq(trips.id, requests.tripId))
    .innerJoin(users, eq(users.id, trips.gpId))
    .where(eq(requests.clientId, u.id))
    .orderBy(desc(requests.createdAt));

  const waiting = await db
    .select({ p: parcels, offers: count(parcelOffers.id) })
    .from(parcels)
    .leftJoin(parcelOffers, eq(parcelOffers.parcelId, parcels.id))
    .where(and(eq(parcels.clientId, u.id), eq(parcels.status, "open")))
    .groupBy(parcels.id)
    .orderBy(desc(parcels.createdAt));
  const today = todayIso();

  const current = list.filter((x) => x.r.status === "pending" || x.r.status === "accepted");
  const past = list.filter((x) => !(x.r.status === "pending" || x.r.status === "accepted"));

  if (!list.length && !waiting.length)
    return (
      <div className="card empty">
        Vous n&apos;avez pas encore fait de demande.
        <br />
        <br />
        <Link className="btn" href="/">
          Trouver un GP
        </Link>
        <br />
        <br />
        <Link className="btn alt" href="/colis/nouveau">
          Déposer une demande d&apos;envoi
        </Link>
      </div>
    );

  const Item = ({ x }: { x: (typeof list)[number] }) => (
    <Link href={`/demandes/${x.r.id}`} className="trip" style={{ textDecoration: "none", color: "inherit" }}>
      <TripRoute from={x.t.fromCity} to={x.t.toCity} />
      <div className="between">
        <span>
          <StatusPill status={x.r.status} /> · GP : <b>{x.gpName}</b> · départ {shortDate(x.t.departureDate)}
        </span>
        <b>
          {x.r.weightKg} kg · {euros(x.r.weightKg * x.r.pricePerKg)}
        </b>
      </div>
    </Link>
  );

  return (
    <>
      <h1>Mes demandes</h1>
      {waiting.length > 0 && (
        <>
          <h2>En attente d&apos;un GP ({waiting.length})</h2>
          {waiting.map(({ p, offers }) => (
            <Link key={p.id} href={`/colis/${p.id}`} className="trip" style={{ textDecoration: "none", color: "inherit" }}>
              <TripRoute from={p.fromCity} to={p.toCity} />
              <div className="between">
                <span>
                  {p.beforeDate && p.beforeDate < today ? (
                    <span className="pill cancelled">Date passée</span>
                  ) : (
                    <span className="pill pending">Sans trajet</span>
                  )}{" "}
                  · {p.weightKg} kg · {p.category}
                  {p.beforeDate ? ` · avant le ${shortDate(p.beforeDate)}` : ""}
                </span>
                <b>{offers ? `${offers} proposition${offers > 1 ? "s" : ""} de GP` : "Pas encore de proposition"}</b>
              </div>
            </Link>
          ))}
        </>
      )}
      <h2>En cours ({current.length})</h2>
      {current.length ? current.map((x) => <Item key={x.r.id} x={x} />) : <p className="tag">Aucune demande en cours.</p>}
      <h2>Historique ({past.length})</h2>
      {past.length ? past.map((x) => <Item key={x.r.id} x={x} />) : <p className="tag">Rien dans l&apos;historique pour l&apos;instant.</p>}
    </>
  );
}
