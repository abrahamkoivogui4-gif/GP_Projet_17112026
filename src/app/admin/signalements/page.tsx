import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { reports, trips, users } from "@/db/schema";
import { dateTime } from "@/lib/format";
import { setTripStatus, setUserSuspended, updateReport } from "@/app/admin-actions";
import { StatusPill } from "@/components/StatusPill";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata = { title: "Signalements" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const reporter = alias(users, "reporter");
  const target = alias(users, "target");
  const rows = await db
    .select({ r: reports, reporterName: reporter.name, targetName: target.name, targetId: target.id, targetSuspended: target.suspended, tripStatus: trips.status })
    .from(reports)
    .innerJoin(reporter, eq(reporter.id, reports.reporterId))
    .leftJoin(target, eq(target.id, reports.targetUserId))
    .leftJoin(trips, eq(trips.id, reports.tripId))
    .orderBy(desc(reports.urgent), desc(reports.createdAt))
    .limit(200);
  const open = rows.filter((x) => x.r.status !== "closed");
  const closed = rows.filter((x) => x.r.status === "closed");

  const Item = ({ x }: { x: (typeof rows)[number] }) => (
    <div className="card">
      <div>
        <StatusPill kind="report" status={x.r.status} /> {x.r.urgent && <span className="pill urgent">Urgent</span>} <b>{x.r.type}</b>
        <br />
        <span className="tag">
          {x.r.subject} · par {x.reporterName} · {dateTime(x.r.createdAt)}
        </span>
      </div>
      <div className="note">{x.r.description}</div>
      {x.r.requestId && (
        <Link className="link" href={`/demandes/${x.r.requestId}`}>
          Voir la demande et la discussion
        </Link>
      )}
      {x.r.status !== "closed" ? (
        <form action={updateReport} className="field" style={{ gap: 10 }}>
          <input type="hidden" name="id" value={x.r.id} />
          <textarea name="reply" maxLength={2000} defaultValue={x.r.adminReply} placeholder="Réponse à la personne qui a signalé (facultatif)" />
          <div className="row">
            <SubmitButton name="status" value="in_progress" className="btn alt small">
              Marquer en cours
            </SubmitButton>
            <SubmitButton name="status" value="closed" className="btn small">
              Clôturer
            </SubmitButton>
          </div>
        </form>
      ) : (
        x.r.adminReply && (
          <div className="note">
            <b>Réponse envoyée</b>
            {x.r.adminReply}
          </div>
        )
      )}
      <div className="row">
        {x.r.tripId && x.tripStatus && x.tripStatus !== "cancelled" && (
          <form action={setTripStatus}>
            <input type="hidden" name="id" value={x.r.tripId} />
            <input type="hidden" name="status" value={x.tripStatus === "active" ? "suspended" : "active"} />
            <SubmitButton className={`btn small ${x.tripStatus === "active" ? "no" : "alt"}`}>{x.tripStatus === "active" ? "Suspendre le trajet" : "Réactiver le trajet"}</SubmitButton>
          </form>
        )}
        {x.targetId && (
          <form action={setUserSuspended}>
            <input type="hidden" name="id" value={x.targetId} />
            <input type="hidden" name="suspended" value={x.targetSuspended ? "0" : "1"} />
            <SubmitButton className={`btn small ${x.targetSuspended ? "alt" : "no"}`}>
              {x.targetSuspended ? `Réactiver ${x.targetName}` : `Suspendre le compte de ${x.targetName}`}
            </SubmitButton>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <>
      <h1>Signalements ouverts ({open.length})</h1>
      {open.length === 0 && <p className="tag">Aucun signalement ouvert.</p>}
      {open.map((x) => (
        <Item key={x.r.id} x={x} />
      ))}
      {closed.length > 0 && <h2>Traités ({closed.length})</h2>}
      {closed.map((x) => (
        <Item key={x.r.id} x={x} />
      ))}
    </>
  );
}
