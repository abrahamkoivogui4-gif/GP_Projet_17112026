import Link from "next/link";
import { and, asc, eq, gte, isNull, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { parcelOffers, parcels, trips, users } from "@/db/schema";
import { requireGp } from "@/lib/auth";
import { CITIES } from "@/lib/constants";
import { euros, shortDate, todayIso } from "@/lib/format";
import { AutoSubmit } from "@/components/AutoSubmit";
import { OfferForm } from "@/components/OfferForm";
import { TripRoute } from "@/components/TripCard";

export const metadata = { title: "Colis en attente" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ de?: string; vers?: string }> }) {
  const u = await requireGp();
  const sp = await searchParams;
  const city = (c?: string) => (c && (CITIES as readonly string[]).includes(c) ? c : "");
  const from = city(sp.de);
  const to = city(sp.vers);
  const today = todayIso();

  const conds = [eq(parcels.status, "open"), ne(parcels.clientId, u.id), eq(users.suspended, false), or(isNull(parcels.beforeDate), gte(parcels.beforeDate, today))];
  if (from) conds.push(eq(parcels.fromCity, from));
  if (to) conds.push(eq(parcels.toCity, to));
  const [list, myTrips, myOffers] = await Promise.all([
    db
      .select({ p: parcels, clientName: users.name })
      .from(parcels)
      .innerJoin(users, eq(users.id, parcels.clientId))
      .where(and(...conds))
      .orderBy(asc(parcels.beforeDate), asc(parcels.createdAt))
      .limit(100),
    db
      .select()
      .from(trips)
      .where(and(eq(trips.gpId, u.id), eq(trips.status, "active"), gte(trips.departureDate, today)))
      .orderBy(asc(trips.departureDate)),
    db.select({ parcelId: parcelOffers.parcelId, tripId: parcelOffers.tripId }).from(parcelOffers).where(eq(parcelOffers.gpId, u.id)),
  ]);
  const offered = new Set(myOffers.map((o) => o.parcelId));

  return (
    <>
      <div>
        <h1>Colis en attente</h1>
        <p className="lead">Des expéditeurs cherchent un GP. Proposez-leur un de vos trajets, ou publiez-en un pour eux.</p>
      </div>
      <form className="card" method="get" action="/gp/colis">
        <AutoSubmit />
        <div className="row">
          <div className="field">
            <label htmlFor="de">Départ</label>
            <select id="de" name="de" defaultValue={from}>
              <option value="">Toutes les villes</option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="vers">Arrivée</label>
            <select id="vers" name="vers" defaultValue={to}>
              <option value="">Toutes les villes</option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <noscript>
          <button className="btn" type="submit">
            Filtrer
          </button>
        </noscript>
      </form>

      <p className="kicker">{list.length > 1 ? `${list.length} colis cherchent un GP` : `${list.length} colis cherche un GP`}</p>
      {list.length === 0 && <div className="card empty">Aucun colis en attente pour ce trajet.</div>}
      {list.map(({ p, clientName }) => {
        const fits = myTrips.filter((t) => t.fromCity === p.fromCity && t.toCity === p.toCity && (!p.beforeDate || t.departureDate <= p.beforeDate));
        return (
          <article className="trip" key={p.id}>
            <TripRoute from={p.fromCity} to={p.toCity} />
            <div className="fields">
              <div>
                <small>Poids</small>
                <b>{p.weightKg} kg</b>
              </div>
              <div>
                <small>Type</small>
                <b>{p.category}</b>
              </div>
              <div>
                <small>Départ souhaité</small>
                <b>{p.beforeDate ? `avant le ${shortDate(p.beforeDate)}` : "dès que possible"}</b>
              </div>
            </div>
            <div className="note">
              <b>{clientName.split(" ")[0]}</b>
              {p.description || "Pas de description"}
            </div>
            {offered.has(p.id) ? (
              <p className="okmsg">✅ Vous avez proposé votre trajet. Le client peut vous envoyer sa demande.</p>
            ) : fits.length ? (
              <OfferForm
                parcelId={p.id}
                trips={fits.map((t) => ({ id: t.id, label: `${shortDate(t.departureDate)} · ${euros(t.pricePerKg)}/kg · ${t.capacityKg} kg` }))}
              />
            ) : (
              <Link className="btn alt small" href={`/gp/publier?de=${encodeURIComponent(p.fromCity)}&vers=${encodeURIComponent(p.toCity)}`}>
                Publier un trajet {p.fromCity} → {p.toCity}
              </Link>
            )}
          </article>
        );
      })}
    </>
  );
}
