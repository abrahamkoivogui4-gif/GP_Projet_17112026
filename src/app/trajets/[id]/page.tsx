import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { parcels } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { delayLabel, etaLabel, euros, longDate, shortDate, todayIso } from "@/lib/format";
import { getGpReviews, getTrip } from "@/lib/queries";
import { countryCodeForCity } from "@/lib/constants";
import { ForbiddenList, GpLine, TripRoute } from "@/components/TripCard";
import { RequestForm } from "@/components/RequestForm";
import { Stars } from "@/components/Stars";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTrip(Number((await params).id) || 0);
  return { title: t ? `${t.fromCity} → ${t.toCity} avec ${t.gpName}` : "Trajet" };
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ colis?: string }> }) {
  const id = Number((await params).id);
  const colis = Number((await searchParams).colis) || 0;
  const [t, user] = await Promise.all([getTrip(id || 0), getUser()]);
  if (!t || (t.status !== "active" && t.gpId !== user?.id && user?.role !== "admin")) notFound();
  const reviews = await getGpReviews(t.gpId, 10);
  const free = Math.max(0, t.capacityKg - t.bookedKg);
  const open = t.status === "active" && t.departureDate >= todayIso() && free > 0;
  // Venu d'une demande d'envoi sans trajet : on pré-remplit le formulaire.
  const parcel =
    user && colis
      ? await db.query.parcels.findFirst({
          where: and(eq(parcels.id, colis), eq(parcels.clientId, user.id), eq(parcels.status, "open")),
          columns: { id: true, weightKg: true, category: true, description: true },
        })
      : undefined;
  const back = colis ? `/trajets/${t.id}?colis=${colis}` : `/trajets/${t.id}`;

  return (
    <>
      <article className="trip">
        <TripRoute from={t.fromCity} to={t.toCity} />
        <dl className="recap">
          <dt>Départ</dt>
          <dd>{longDate(t.departureDate)}</dd>
          <dt>Prix par kilo</dt>
          <dd>{euros(t.pricePerKg)}</dd>
          <dt>Place libre</dt>
          <dd>{free} kg</dd>
          <dt>Livraison</dt>
          <dd>sous {delayLabel(t.deliveryDays)} après l&apos;arrivée</dd>
          <dt>Livré au plus tard</dt>
          <dd>{etaLabel(t.departureDate, t.deliveryDays)}</dd>
        </dl>
        <GpLine name={t.gpName} verified={t.gpVerified} rating={t.rating} count={t.reviewCount} />
        <ForbiddenList items={t.forbiddenItems} />
      </article>

      {!open ? (
        <div className="card empty">Ce trajet ne prend plus de demandes.</div>
      ) : !user ? (
        <div className="card">
          <h2>Envoyer un colis avec {t.gpName}</h2>
          <p>Connectez-vous ou créez un compte pour envoyer votre demande. C&apos;est gratuit.</p>
          <Link className="btn" href={`/connexion?suite=${encodeURIComponent(back)}`}>
            Se connecter
          </Link>
          <Link className="btn alt" href={`/inscription?suite=${encodeURIComponent(back)}`}>
            Créer un compte
          </Link>
        </div>
      ) : user.id === t.gpId ? (
        <div className="card">
          <p>C&apos;est votre trajet.</p>
          <Link className="btn alt" href={`/gp/trajets/${t.id}`}>
            Modifier ce trajet
          </Link>
        </div>
      ) : (
        <RequestForm tripId={t.id} gpName={t.gpName} price={t.pricePerKg} free={free} forbidden={t.forbiddenItems} defaultCc={countryCodeForCity(t.toCity)} parcel={parcel} />
      )}

      <section className="card">
        <h2>Avis sur {t.gpName}</h2>
        {reviews.length ? (
          reviews.map((r, i) => (
            <div className="rev" key={i}>
              <Stars value={r.stars} /> <b>{r.clientName}</b> <small>· {shortDate(r.createdAt.toISOString().slice(0, 10))}</small>
              <br />
              {r.comment || <small>Sans commentaire</small>}
            </div>
          ))
        ) : (
          <p className="tag">Pas encore d&apos;avis.</p>
        )}
      </section>

      {user && user.id !== t.gpId && (
        <Link className="link" href={`/signaler?sujet=t${t.id}`}>
          Signaler ce trajet
        </Link>
      )}
    </>
  );
}
