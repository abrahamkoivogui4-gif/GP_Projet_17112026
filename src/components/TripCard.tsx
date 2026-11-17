import Link from "next/link";
import type { TripView } from "@/lib/queries";
import { delayLabel, euros, shortDate } from "@/lib/format";
import { Stars } from "./Stars";
import { VerifiedBadge } from "./VerifiedBadge";

export function TripRoute({ from, to }: { from: string; to: string }) {
  return (
    <div className="route">
      <div>
        <small>Ville de départ</small>
        <b>{from}</b>
      </div>
      <span className="arrow" aria-hidden>
        →
      </span>
      <div>
        <small>Destination</small>
        <b>{to}</b>
      </div>
    </div>
  );
}

export function GpLine({ name, verified, rating, count }: { name: string; verified: boolean; rating: number; count: number }) {
  return (
    <div className="who">
      <div className="avatar" aria-hidden>
        {name.charAt(0).toUpperCase()}
      </div>
      <div>
        <b>{name}</b> {verified ? <VerifiedBadge /> : <span className="wait">Pas encore vérifié</span>}
        <br />
        {count ? (
          <>
            <Stars value={rating} /> <b>{rating.toFixed(1)}</b> ({count} avis)
          </>
        ) : (
          <span className="tag">Nouveau GP, pas encore d&apos;avis</span>
        )}
      </div>
    </div>
  );
}

export function ForbiddenList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <details className="ban">
      <summary>Objets refusés par ce GP ({items.length})</summary>
      <ul>
        {items.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </details>
  );
}

export function TripCard({ t, action = true }: { t: TripView; action?: boolean }) {
  const free = Math.max(0, t.capacityKg - t.bookedKg);
  return (
    <article className="trip">
      <TripRoute from={t.fromCity} to={t.toCity} />
      <div className="fields">
        <div>
          <small>Départ</small>
          <b>{shortDate(t.departureDate)}</b>
        </div>
        <div>
          <small>Prix par kilo</small>
          <b>{euros(t.pricePerKg)}</b>
        </div>
        <div>
          <small>Place libre</small>
          <b>{free} kg</b>
        </div>
        <div>
          <small>Livraison</small>
          <b>sous {delayLabel(t.deliveryDays)}</b>
        </div>
      </div>
      <GpLine name={t.gpName} verified={t.gpVerified} rating={t.rating} count={t.reviewCount} />
      <ForbiddenList items={t.forbiddenItems} />
      {action && (
        <Link className="btn small" href={`/trajets/${t.id}`}>
          {free > 0 ? "Voir et demander ce GP" : "Voir le trajet (complet)"}
        </Link>
      )}
    </article>
  );
}
