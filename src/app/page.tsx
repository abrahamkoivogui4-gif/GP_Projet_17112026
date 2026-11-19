import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { tripAlerts } from "@/db/schema";
import { createAlert } from "@/app/parcel-actions";
import { getUser } from "@/lib/auth";
import { searchTrips } from "@/lib/queries";
import { CITIES } from "@/lib/constants";
import { todayIso } from "@/lib/format";
import { TripCard } from "@/components/TripCard";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { AutoSubmit } from "@/components/AutoSubmit";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

type SP = { de?: string; vers?: string; date?: string; verifies?: string; tri?: string; alerte?: string };

export default async function Home({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const city = (c?: string) => (c && (CITIES as readonly string[]).includes(c) ? c : "");
  const f = { from: city(sp.de), to: city(sp.vers), date: /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date : "", verified: sp.verifies === "1", sort: sp.tri };
  const [list, user] = await Promise.all([searchTrips(f), getUser()]);
  const route = f.from || f.to ? `${f.from || "toutes les villes"} → ${f.to || "toutes les villes"}` : "tous les trajets";
  const hasAlert = user
    ? !!(await db.query.tripAlerts.findFirst({
        where: and(
          eq(tripAlerts.userId, user.id),
          f.from ? eq(tripAlerts.fromCity, f.from) : isNull(tripAlerts.fromCity),
          f.to ? eq(tripAlerts.toCity, f.to) : isNull(tripAlerts.toCity),
        ),
        columns: { id: true },
      }))
    : false;
  const q = new URLSearchParams();
  if (f.from) q.set("de", f.from);
  if (f.to) q.set("vers", f.to);
  const here = `/${q.size ? `?${q}` : ""}`;
  const parcelHref = `/colis/nouveau${q.size ? `?${q}` : ""}`;

  return (
    <>
      <form className="card" method="get" action="/">
        <AutoSubmit />
        <h1>Quel GP cherchez-vous ?</h1>
        <p className="lead">Lilalink, le colis entre personnes de confiance.</p>
        <div className="row">
          <div className="field">
            <label htmlFor="de">Départ</label>
            <select id="de" name="de" defaultValue={f.from}>
              <option value="">Toutes les villes</option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="vers">Arrivée</label>
            <select id="vers" name="vers" defaultValue={f.to}>
              <option value="">Toutes les villes</option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="date">À partir du (facultatif)</label>
            <input id="date" name="date" type="date" min={todayIso()} defaultValue={f.date} />
          </div>
          <div className="field">
            <label htmlFor="tri">Trier par</label>
            <select id="tri" name="tri" defaultValue={f.sort ?? "date"}>
              <option value="date">Départ le plus tôt</option>
              <option value="prix">Prix au kilo le plus bas</option>
              <option value="note">Mieux notés</option>
            </select>
          </div>
        </div>
        <label className="check">
          <input type="checkbox" name="verifies" value="1" defaultChecked={f.verified} />
          <span>
            Seulement les GP vérifiés <VerifiedBadge size={20} />
          </span>
        </label>
        <noscript>
          <button className="btn" type="submit">
            Chercher
          </button>
        </noscript>
      </form>

      <p className="kicker">{list.length > 1 ? `${list.length} trajets trouvés` : `${list.length} trajet trouvé`}</p>
      {list.length ? (
        list.map((t) => <TripCard key={t.id} t={t} />)
      ) : (
        <div className="card">
          <h2>Aucun trajet pour le moment</h2>
          <p>Déposez quand même votre demande d&apos;envoi : les GP la voient et vous proposent leur trajet.</p>
          <Link className="btn" href={parcelHref}>
            Déposer une demande d&apos;envoi
          </Link>
        </div>
      )}

      <form action={createAlert} className="card wa">
        <input type="hidden" name="fromCity" value={f.from} />
        <input type="hidden" name="toCity" value={f.to} />
        <input type="hidden" name="back" value={here} />
        <div className="wa-head">
          <WhatsAppIcon />
          <div>
            <h3>Être prévenu sur WhatsApp</h3>
            <p className="tag">Recevez un message à chaque nouveau trajet : {route}.</p>
          </div>
        </div>
        {sp.alerte || hasAlert ? (
          <p className="okmsg">
            ✅ Alerte activée.{" "}
            <Link href="/alertes" className="tag">
              Gérer mes alertes
            </Link>
          </p>
        ) : user ? (
          <SubmitButton className="btn wa-btn">Activer l&apos;alerte WhatsApp</SubmitButton>
        ) : (
          <Link className="btn wa-btn" href={`/connexion?suite=${encodeURIComponent(here)}`}>
            Se connecter pour activer l&apos;alerte
          </Link>
        )}
        <p className="hint">Sur votre numéro de compte. Vous pouvez l&apos;arrêter à tout moment.</p>
      </form>

      {list.length > 0 && (
        <Link className="btn alt" href={parcelHref}>
          Aucun trajet ne convient ? Déposer une demande d&apos;envoi
        </Link>
      )}
    </>
  );
}

function WhatsAppIcon() {
  return (
    <span className="wa-ico" aria-hidden>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    </span>
  );
}
