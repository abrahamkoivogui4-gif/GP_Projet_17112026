import Link from "next/link";
import type { TripView } from "@/lib/queries";
import { delayLabel, euros, shortDate, todayIso } from "@/lib/format";
import { VerifiedBadge } from "./VerifiedBadge";

/** Petite mention en haut de la carte : ce qui rend ce trajet intéressant en un coup d'œil. */
function eyebrow(t: TripView, free: number) {
  if (free <= 0) return "Complet";
  const days = Math.round((Date.parse(t.departureDate) - Date.parse(todayIso())) / 86_400_000);
  if (days <= 0) return "Départ aujourd'hui";
  if (days === 1) return "Départ demain";
  if (days <= 7) return `Départ dans ${days} jours`;
  if (t.gpVerified) return "GP vérifié";
  return "Nouveau trajet";
}

/** Carte de trajet du bandeau d'accueil : grande, aérée, entièrement cliquable. */
export function TripTile({ t }: { t: TripView }) {
  const free = Math.max(0, t.capacityKg - t.bookedKg);
  return (
    <Link href={`/trajets/${t.id}`} className={`tile${free ? "" : " full"}`}>
      <span className="eyebrow">{eyebrow(t, free)}</span>
      <h3>
        {t.fromCity} <span aria-label="vers">→</span> {t.toCity}
      </h3>
      <p className="tile-sub">
        Départ {shortDate(t.departureDate)}
        <br />
        Livraison sous {delayLabel(t.deliveryDays)}
      </p>
      <RouteArt />
      <div className="tile-foot">
        <p className="tile-price">
          <b>{euros(t.pricePerKg)}</b> par kilo · {free} kg libres
        </p>
        <p className="tile-gp">
          <span className="avatar" aria-hidden>
            {t.gpName.charAt(0).toUpperCase()}
          </span>
          <span>
            {t.gpName} {t.gpVerified && <VerifiedBadge size={16} />}
            <br />
            <small>{t.reviewCount ? `★ ${t.rating.toFixed(1)} · ${t.reviewCount} avis` : "Pas encore d'avis"}</small>
          </span>
        </p>
      </div>
    </Link>
  );
}

function RouteArt() {
  return (
    <div className="tile-route" aria-hidden>
      <i className="dot" />
      <i className="line" />
      <svg viewBox="0 0 24 24" width="28" height="28">
        <path
          fill="currentColor"
          d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"
          transform="rotate(90 12 12)"
        />
      </svg>
      <i className="line" />
      <i className="sq" />
    </div>
  );
}

/** Carte d'un trajet dans l'Espace GP : état du trajet, demandes à traiter, remplissage. */
export function GpTripTile({ t, pending }: { t: TripView; pending: number }) {
  const today = todayIso();
  const days = Math.round((Date.parse(t.departureDate) - Date.parse(today)) / 86_400_000);
  const past = t.departureDate < today;
  const booked = Math.min(t.bookedKg, t.capacityKg);
  const pct = t.capacityKg ? Math.round((booked / t.capacityKg) * 100) : 0;
  let eyebrow = "En ligne";
  let hot = false;
  if (t.status === "cancelled") eyebrow = "Annulé";
  else if (t.status === "suspended") eyebrow = "Suspendu par l'équipe Lilalink";
  else if (pending > 0) {
    eyebrow = pending > 1 ? `${pending} demandes à traiter` : "1 demande à traiter";
    hot = true;
  } else if (past) eyebrow = "Terminé";
  else if (days <= 0) eyebrow = "Départ aujourd'hui";
  else if (days === 1) eyebrow = "Départ demain";
  else if (days <= 7) eyebrow = `Départ dans ${days} jours`;

  const body = (
    <>
      <span className={`eyebrow${hot ? "" : " calm"}`}>{eyebrow}</span>
      <h3>
        {t.fromCity} <span aria-label="vers">→</span> {t.toCity}
      </h3>
      <p className="tile-sub">
        Départ {shortDate(t.departureDate)}
        <br />
        {euros(t.pricePerKg)} par kilo · livraison sous {delayLabel(t.deliveryDays)}
      </p>
      <RouteArt />
      <div className="tile-foot">
        <div className="fill">
          <p className="tile-price">
            <b>
              {booked} / {t.capacityKg} kg
            </b>{" "}
            réservés
          </p>
          <div className="fillbar" role="img" aria-label={`${pct} % de la place réservée`}>
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>
        {t.status !== "cancelled" && <span className="tile-more">Gérer le trajet ›</span>}
      </div>
    </>
  );

  return t.status === "cancelled" ? (
    <div className="tile full">{body}</div>
  ) : (
    <Link href={`/gp/trajets/${t.id}`} className={`tile${past ? " full" : ""}`}>
      {body}
    </Link>
  );
}

/** Dernière carte de la vitrine : publier un nouveau trajet. */
export function NewTripTile() {
  return (
    <Link href="/gp/publier" className="tile tile-new">
      <span className="plus" aria-hidden>
        +
      </span>
      <h3>Publier un nouveau trajet</h3>
      <p className="tile-sub">Ville, date, kilos et prix : c&apos;est fait en une minute.</p>
    </Link>
  );
}
