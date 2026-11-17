import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { requests, trips, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { euros, shortDate } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";
import { TripRoute } from "@/components/TripCard";

export const metadata = { title: "Mes demandes" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const u = await requireUser("/demandes");
  const list = await db
    .select({ r: requests, t: trips, gpName: users.name })
    .from(requests)
    .innerJoin(trips, eq(trips.id, requests.tripId))
    .innerJoin(users, eq(users.id, trips.gpId))
    .where(eq(requests.clientId, u.id))
    .orderBy(desc(requests.createdAt));

  const current = list.filter((x) => x.r.status === "pending" || x.r.status === "accepted");
  const past = list.filter((x) => !(x.r.status === "pending" || x.r.status === "accepted"));

  if (!list.length)
    return (
      <div className="card empty">
        Vous n&apos;avez pas encore fait de demande.
        <br />
        <br />
        <Link className="btn" href="/">
          Trouver un GP
        </Link>
      </div>
    );

  const Item = ({ x }: { x: (typeof list)[number] }) => (
    <Link href={`/demandes/${x.r.id}`} className="trip" style={{ textDecoration: "none", color: "inherit" }}>
      <TripRoute from={x.t.fromCity} to={x.t.toCity} />
      <div className="between">
        <span>
          <StatusPill status={x.r.status} /> · GP : <b>{x.gpName}</b> · départ {shortDate(x.t.departureDate)}
        </span>
        <b>
          {x.r.weightKg} kg · {euros(x.r.weightKg * x.r.pricePerKg)}
        </b>
      </div>
    </Link>
  );

  return (
    <>
      <h1>Mes demandes</h1>
      <h2>En cours ({current.length})</h2>
      {current.length ? current.map((x) => <Item key={x.r.id} x={x} />) : <p className="tag">Aucune demande en cours.</p>}
      <h2>Historique ({past.length})</h2>
      {past.length ? past.map((x) => <Item key={x.r.id} x={x} />) : <p className="tag">Rien dans l&apos;historique pour l&apos;instant.</p>}
    </>
  );
}
