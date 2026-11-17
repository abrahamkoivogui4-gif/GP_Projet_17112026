import { desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { reports, requests, trips, users } from "@/db/schema";
import { alias } from "drizzle-orm/pg-core";
import { requireUser } from "@/lib/auth";
import { shortDate } from "@/lib/format";
import { getTrip } from "@/lib/queries";
import { ReportForm } from "@/components/ReportForm";
import { StatusPill } from "@/components/StatusPill";

export const metadata = { title: "Signaler un problème" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ sujet?: string }> }) {
  const u = await requireUser("/signaler");
  const { sujet } = await searchParams;

  // Les personnes avec qui l'utilisateur a été mis en relation (comme client ou comme GP)
  const gp = alias(users, "gp");
  const client = alias(users, "client");
  const rel = await db
    .select({ id: requests.id, clientId: requests.clientId, from: trips.fromCity, to: trips.toCity, date: trips.departureDate, gpName: gp.name, clientName: client.name })
    .from(requests)
    .innerJoin(trips, eq(trips.id, requests.tripId))
    .innerJoin(gp, eq(gp.id, trips.gpId))
    .innerJoin(client, eq(client.id, requests.clientId))
    .where(or(eq(requests.clientId, u.id), eq(trips.gpId, u.id)))
    .orderBy(desc(requests.createdAt))
    .limit(50);
  const subjects = rel.map((r) => ({
    value: `r${r.id}`,
    label: `${r.clientId === u.id ? r.gpName : r.clientName} · ${r.from} → ${r.to} · ${shortDate(r.date)}`,
  }));
  // Signalement d'un trajet sans demande (depuis la page du trajet)
  if (sujet?.startsWith("t")) {
    const t = await getTrip(Number(sujet.slice(1)) || 0);
    if (t) subjects.unshift({ value: `t${t.id}`, label: `${t.gpName} · ${t.fromCity} → ${t.toCity} · ${shortDate(t.departureDate)}` });
  }

  const mine = await db.select().from(reports).where(eq(reports.reporterId, u.id)).orderBy(desc(reports.createdAt));

  return (
    <>
      <ReportForm subjects={subjects} initialSubject={sujet} />
      {mine.length > 0 && <h2>Vos signalements</h2>}
      {mine.map((r) => (
        <article className="trip" key={r.id}>
          <div>
            <StatusPill kind="report" status={r.status} /> <b>{r.type}</b>
            <br />
            <span className="tag">{r.subject}</span>
          </div>
          <div className="note">
            <b>Votre message</b>
            {r.description}
          </div>
          {r.adminReply ? (
            <div className="note">
              <b>Réponse de l&apos;équipe</b>
              {r.adminReply}
            </div>
          ) : (
            <p className="tag">L&apos;équipe vous répondra ici.</p>
          )}
        </article>
      ))}
    </>
  );
}
