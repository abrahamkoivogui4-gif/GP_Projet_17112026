import Link from "next/link";
import { requireGp } from "@/lib/auth";
import { getGpTrips } from "@/lib/queries";
import { todayIso } from "@/lib/format";
import { GpTripTile, NewTripTile } from "@/components/TripTile";
import { TripRail } from "@/components/TripRail";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { EmailNotifyForm } from "@/components/EmailNotifyForm";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { requests, trips, users } from "@/db/schema";

export const metadata = { title: "Espace GP" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ annule?: string }> }) {
  const u = await requireGp();
  const { annule } = await searchParams;
  const [list, me, pendingRows] = await Promise.all([
    getGpTrips(u.id),
    db.query.users.findFirst({ where: eq(users.id, u.id), columns: { email: true, emailNotify: true } }),
    db
      .select({ tripId: requests.tripId, n: count() })
      .from(requests)
      .innerJoin(trips, eq(trips.id, requests.tripId))
      .where(and(eq(trips.gpId, u.id), eq(requests.status, "pending")))
      .groupBy(requests.tripId),
  ]);
  const pending = new Map(pendingRows.map((r) => [r.tripId, r.n]));
  const today = todayIso();
  const upcoming = list.filter((t) => t.departureDate >= today && t.status !== "cancelled");
  const past = list.filter((t) => !(t.departureDate >= today && t.status !== "cancelled"));

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
      <EmailNotifyForm enabled={!!me?.emailNotify} email={me?.email ?? ""} />

      <TripRail
        title="Vos prochains départs."
        subtitle={upcoming.length ? (upcoming.length > 1 ? `${upcoming.length} trajets en ligne.` : "1 trajet en ligne.") : "Aucun trajet en ligne pour l'instant."}
      >
        {[...upcoming].reverse().map((t) => (
          <GpTripTile key={t.id} t={t} pending={pending.get(t.id) ?? 0} />
        ))}
        <NewTripTile />
      </TripRail>
      {past.length > 0 && (
        <TripRail title="Historique." subtitle="Vos trajets passés et annulés.">
          {past.map((t) => (
            <GpTripTile key={t.id} t={t} pending={pending.get(t.id) ?? 0} />
          ))}
        </TripRail>
      )}
    </>
  );
}
