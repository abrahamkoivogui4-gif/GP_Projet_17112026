import Link from "next/link";
import { count, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { parcels, reports, requests, reviews, tripAlerts, trips, users, verificationDocs } from "@/db/schema";
import { todayIso } from "@/lib/format";

export const metadata = { title: "Administration" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const [byStatus, [tripsActive], [usersCount], [gpCount], [rating], [openReports], [pendingDocs], [last7], [openParcels], [alerts]] = await Promise.all([
    db.select({ status: requests.status, n: count() }).from(requests).groupBy(requests.status),
    db.select({ n: count() }).from(trips).where(sql`${trips.status} = 'active' and ${trips.departureDate} >= ${todayIso()}`),
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(users).where(eq(users.role, "gp")),
    db.select({ avg: sql<number>`coalesce(round(avg(${reviews.stars})::numeric, 1)::float, 0)`, n: count() }).from(reviews),
    db.select({ n: count() }).from(reports).where(inArray(reports.status, ["new", "in_progress"])),
    db.select({ n: count() }).from(verificationDocs).where(eq(verificationDocs.status, "pending")),
    db.select({ n: count() }).from(requests).where(gte(requests.createdAt, new Date(Date.now() - 7 * 24 * 3600_000))),
    db.select({ n: count() }).from(parcels).where(eq(parcels.status, "open")),
    db.select({ n: sql<number>`count(distinct ${tripAlerts.userId})::int` }).from(tripAlerts),
  ]);
  const s = Object.fromEntries(byStatus.map((x) => [x.status, x.n])) as Record<string, number>;
  const total = byStatus.reduce((a, x) => a + x.n, 0);
  const validated = (s.accepted ?? 0) + (s.delivered ?? 0);
  const decided = validated + (s.refused ?? 0);
  const todo = openReports.n + pendingDocs.n;
  const Bar = ({ l, v }: { l: string; v: number }) => (
    <div className="bar">
      <span>{l}</span>
      <div>
        <i style={{ width: `${total ? Math.round((v / total) * 100) : 0}%` }} />
      </div>
      <b>{v}</b>
    </div>
  );

  return (
    <>
      <h1>Tableau de bord</h1>
      <div className="kpis">
        <div className="kpi">
          <b>{tripsActive.n}</b>
          <span>Trajets à venir</span>
        </div>
        <div className="kpi">
          <b>{total}</b>
          <span>Demandes ({last7.n} cette semaine)</span>
        </div>
        <div className="kpi">
          <b>{decided ? `${Math.round((validated / decided) * 100)} %` : "—"}</b>
          <span>Demandes acceptées</span>
        </div>
        <div className="kpi">
          <b>{s.delivered ?? 0}</b>
          <span>Colis livrés</span>
        </div>
        <div className="kpi">
          <b>{rating.n ? `${rating.avg} ★` : "—"}</b>
          <span>Note moyenne ({rating.n} avis)</span>
        </div>
        <div className="kpi">
          <b>
            {usersCount.n}
          </b>
          <span>Inscrits dont {gpCount.n} GP</span>
        </div>
        <div className="kpi">
          <b>{openParcels.n}</b>
          <span>Colis qui attendent un GP</span>
        </div>
        <div className="kpi">
          <b>{alerts.n}</b>
          <span>Personnes avec une alerte WhatsApp</span>
        </div>
        <Link href={pendingDocs.n ? "/admin/verifications" : "/admin/signalements"} className={`kpi${todo ? " hot" : ""}`} style={{ color: "inherit", textDecoration: "none" }}>
          <b>{todo}</b>
          <span>
            À traiter ({openReports.n} signalement{openReports.n > 1 ? "s" : ""}, {pendingDocs.n} vérification{pendingDocs.n > 1 ? "s" : ""})
          </span>
        </Link>
      </div>
      <div className="card">
        <h3>Parcours des demandes</h3>
        <Bar l="En attente" v={s.pending ?? 0} />
        <Bar l="Validées" v={s.accepted ?? 0} />
        <Bar l="Livrées" v={s.delivered ?? 0} />
        <Bar l="Refusées" v={s.refused ?? 0} />
        <Bar l="Annulées" v={s.cancelled ?? 0} />
      </div>
    </>
  );
}
