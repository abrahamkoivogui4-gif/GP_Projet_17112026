import Link from "next/link";
import { requireGp } from "@/lib/auth";
import { getGpTrips } from "@/lib/queries";
import { delayLabel, euros, shortDate, todayIso } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";
import { TripRoute } from "@/components/TripCard";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { WhatsappForm } from "@/components/WhatsappForm";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { COUNTRY_CODES } from "@/lib/constants";
import { whatsappConfigured } from "@/lib/whatsapp";

/** +224621000000 -> { cc: "+224", national: "621000000" } */
function splitPhone(e164: string) {
  const cc = COUNTRY_CODES.map((c) => c.code)
    .sort((a, b) => b.length - a.length)
    .find((c) => e164.startsWith(c));
  return cc ? { cc, national: e164.slice(cc.length) } : { cc: "+33", national: e164 };
}

export const metadata = { title: "Espace GP" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ annule?: string }> }) {
  const u = await requireGp();
  const { annule } = await searchParams;
  const [list, me] = await Promise.all([
    getGpTrips(u.id),
    db.query.users.findFirst({ where: eq(users.id, u.id), columns: { phone: true, whatsappNotify: true, whatsappPhone: true } }),
  ]);
  const wa = splitPhone(me?.whatsappPhone || u.phone);
  const waForm = (
    <WhatsappForm enabled={!!me?.whatsappNotify} cc={wa.cc} phone={wa.national} configured={whatsappConfigured()} />
  );
  const today = todayIso();
  const upcoming = list.filter((t) => t.departureDate >= today && t.status !== "cancelled");
  const past = list.filter((t) => !(t.departureDate >= today && t.status !== "cancelled"));

  const Item = ({ t }: { t: (typeof list)[number] }) => (
    <article className="trip">
      <TripRoute from={t.fromCity} to={t.toCity} />
      <p>
        <StatusPill kind="trip" status={t.status} /> · départ {shortDate(t.departureDate)} · {t.bookedKg}/{t.capacityKg} kg réservés ·{" "}
        {euros(t.pricePerKg)}/kg · livraison sous {delayLabel(t.deliveryDays)}
      </p>
      {t.status !== "cancelled" && (
        <Link className="btn alt small" href={`/gp/trajets/${t.id}`}>
          Modifier (prix, délai, objets refusés)
        </Link>
      )}
    </article>
  );

  return (
    <>
      {annule && <p className="info">Trajet annulé. Les clients concernés ont été prévenus.</p>}
      {u.verification !== "verified" ? (
        <div className="card accent">
          <VerifiedBadge size={48} />
          <h2>{u.verification === "pending" ? "Badge GP vérifié : contrôle en cours" : "Obtenez le badge GP vérifié"}</h2>
          <p>
            {u.verification === "pending"
              ? "L'équipe contrôle votre pièce d'identité. Le badge apparaîtra sur tous vos trajets dès validation."
              : "Les clients font plus confiance aux GP vérifiés. Envoyez une photo de votre pièce d'identité."}
          </p>
          {u.verification !== "pending" && (
            <Link className="btn" href="/gp/verification">
              Demander le badge
            </Link>
          )}
        </div>
      ) : null}

      <Link className="btn" href="/gp/publier">
        Publier un nouveau trajet
      </Link>
      {waForm}

      <h2>Trajets à venir ({upcoming.length})</h2>
      {upcoming.length ? upcoming.map((t) => <Item key={t.id} t={t} />) : <p className="tag">Aucun trajet à venir.</p>}
      {past.length > 0 && (
        <>
          <h2>Historique ({past.length})</h2>
          {past.map((t) => (
            <Item key={t.id} t={t} />
          ))}
        </>
      )}
    </>
  );
}
