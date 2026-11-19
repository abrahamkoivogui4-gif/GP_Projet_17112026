import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { parcelOffers, parcels } from "@/db/schema";
import { closeParcel } from "@/app/parcel-actions";
import { requireUser } from "@/lib/auth";
import { longDate, todayIso } from "@/lib/format";
import { getTrip, searchTrips } from "@/lib/queries";
import { SubmitButton } from "@/components/SubmitButton";
import { TripCard, TripRoute } from "@/components/TripCard";

export const metadata = { title: "Ma demande d'envoi" };
export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ envoyee?: string }> }) {
  const id = Number((await params).id) || 0;
  const { envoyee } = await searchParams;
  const u = await requireUser(`/colis/${id}`);
  const p = await db.query.parcels.findFirst({ where: eq(parcels.id, id) });
  if (!p || (p.clientId !== u.id && u.role !== "admin")) notFound();

  const today = todayIso();
  const expired = p.status === "open" && !!p.beforeDate && p.beforeDate < today;
  const offers = await db.select({ tripId: parcelOffers.tripId }).from(parcelOffers).where(eq(parcelOffers.parcelId, p.id));
  const offered = (await Promise.all(offers.map((o) => getTrip(o.tripId)))).filter(
    (t): t is NonNullable<typeof t> => !!t && t.status === "active" && t.departureDate >= today,
  );
  const offeredIds = new Set(offered.map((t) => t.id));
  const matching =
    p.status === "open"
      ? (await searchTrips({ from: p.fromCity, to: p.toCity, before: p.beforeDate ?? undefined, excludeGp: p.clientId })).filter((t) => !offeredIds.has(t.id))
      : [];
  const book = (tripId: number) => `/trajets/${tripId}?colis=${p.id}`;

  return (
    <>
      {envoyee && (
        <p className="info">
          ✅ Demande déposée. Les GP qui font ce trajet la voient. Vous serez prévenu sur WhatsApp dès qu&apos;un trajet correspond.
        </p>
      )}
      <article className="trip">
        <p className="kicker">Ma demande d&apos;envoi</p>
        <TripRoute from={p.fromCity} to={p.toCity} />
        <dl className="recap">
          <dt>Colis</dt>
          <dd>
            {p.weightKg} kg · {p.category}
          </dd>
          <dt>Départ souhaité</dt>
          <dd>{p.beforeDate ? `avant le ${longDate(p.beforeDate)}` : "dès que possible"}</dd>
          <dt>État</dt>
          <dd>{p.status === "matched" ? "GP choisi" : p.status === "closed" ? "Fermée" : expired ? "Date passée" : "En attente d'un GP"}</dd>
        </dl>
        {p.description && <div className="note">{p.description}</div>}
        {p.status === "matched" && p.requestId && (
          <Link className="btn" href={`/demandes/${p.requestId}`}>
            Voir ma demande au GP
          </Link>
        )}
      </article>

      {p.status === "open" && (
        <>
          <h2>Propositions des GP ({offered.length})</h2>
          {offered.length ? (
            offered.map((t) => <TripCard key={t.id} t={t} href={book(t.id)} label="Choisir ce GP" />)
          ) : (
            <p className="tag">Aucune proposition pour l&apos;instant. Vous serez prévenu sur WhatsApp.</p>
          )}
          {matching.length > 0 && (
            <>
              <h2>Trajets qui correspondent ({matching.length})</h2>
              {matching.map((t) => (
                <TripCard key={t.id} t={t} href={book(t.id)} label="Choisir ce GP" />
              ))}
            </>
          )}
          {p.clientId === u.id && (
            <form action={closeParcel}>
              <input type="hidden" name="id" value={p.id} />
              <SubmitButton className="btn alt">Je n&apos;ai plus besoin d&apos;envoyer ce colis</SubmitButton>
            </form>
          )}
        </>
      )}
    </>
  );
}
