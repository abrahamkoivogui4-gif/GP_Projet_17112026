import Link from "next/link";
import { count, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { reports, requests, reviews, trips, users, verificationDocs } from "@/db/schema";
import { VisitsChart, type DayStat } from "@/components/VisitsChart";
import { todayIso } from "@/lib/format";

export const metadata = { title: "Administration" };
export const dynamic = "force-dynamic";

/** Pages vues et visiteurs par jour sur les 30 derniers jours (heure de Paris), jours sans visite compris. */
async function visitsByDay(): Promise<DayStat[]> {
  const res = await db.execute<{ day: string; views: number; visitors: number }>(sql`
    with today as (select (now() at time zone 'Europe/Paris')::date as d)
    select to_char(g.day, 'YYYY-MM-DD') as day,
           coalesce(sum(v.views), 0)::int as views,
           count(v.visitor)::int as visitors
    from today, generate_series(today.d - 29, today.d, interval '1 day') as g(day)
    left join site_visits v on v.day = g.day::date
    group by g.day
    order by g.day`);
  return res.rows;
}

export default async function Page() {
  const visits = await visitsByDay();
  const today = visits[visits.length - 1] ?? { views: 0, visitors: 0 };
  const sum = (k: "views" | "visitors", n: number) => visits.slice(-n).reduce((a, d) => a + d[k], 0);
  const [byStatus, [tripsActive], [usersCount], [gpCount], [rating], [openReports], [pendingDocs], [last7]] = await Promise.all([
    db.select({ status: requests.status, n: count() }).from(requests).groupBy(requests.status),
    db.select({ n: count() }).from(trips).where(sql`${trips.status} = 'active' and ${trips.departureDate} >= ${todayIso()}`),
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(users).where(eq(users.role, "gp")),
    db.select({ avg: sql<number>`coalesce(round(avg(${reviews.stars})::numeric, 1)::float, 0)`, n: count() }).from(reviews),
    db.select({ n: count() }).from(reports).where(inArray(reports.status, ["new", "in_progress"])),
    db.select({ n: count() }).from(verificationDocs).where(eq(verificationDocs.status, "pending")),
    db.select({ n: count() }).from(requests).where(gte(requests.createdAt, new Date(Date.now() - 7 * 24 * 3600_000))),
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
        <Link href={pendingDocs.n ? "/admin/verifications" : "/admin/signalements"} className={`kpi${todo ? " hot" : ""}`} style={{ color: "inherit", textDecoration: "none" }}>
          <b>{todo}</b>
          <span>
            À traiter ({openReports.n} signalement{openReports.n > 1 ? "s" : ""}, {pendingDocs.n} vérification{pendingDocs.n > 1 ? "s" : ""})
          </span>
        </Link>
      </div>
      <div className="card">
        <div className="between">
          <h3>Consultations du site</h3>
          <span className="tag">30 derniers jours</span>
        </div>
        <div className="kpis vkpis">
          <div className="kpi">
            <b>{today.views}</b>
            <span>Aujourd&apos;hui · {today.visitors} visiteur{today.visitors > 1 ? "s" : ""}</span>
          </div>
          <div className="kpi">
            <b>{sum("views", 7)}</b>
            <span>Sur 7 jours</span>
          </div>
          <div className="kpi">
            <b>{sum("views", 30)}</b>
            <span>Sur 30 jours</span>
          </div>
        </div>
        <VisitsChart data={visits} />
        <p className="hint" style={{ marginTop: 0 }}>
          Pages vues par jour. Un visiteur est compté une fois par jour, sans cookie ; vos propres visites en tant qu&apos;admin et les robots ne sont pas comptés.
        </p>
        <details>
          <summary className="link">Voir les chiffres jour par jour</summary>
          <table className="vtable">
            <thead>
              <tr>
                <th>Jour</th>
                <th>Pages vues</th>
                <th>Visiteurs</th>
              </tr>
            </thead>
            <tbody>
              {[...visits].reverse().map((d) => (
                <tr key={d.day}>
                  <td>{new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(new Date(`${d.day}T00:00:00Z`))}</td>
                  <td>{d.views}</td>
                  <td>{d.visitors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
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
