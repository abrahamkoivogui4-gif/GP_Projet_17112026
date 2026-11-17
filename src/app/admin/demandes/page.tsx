import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { requests, trips, users } from "@/db/schema";
import { dateTime, euros } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";

export const metadata = { title: "Demandes" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const gp = alias(users, "gp");
  const client = alias(users, "client");
  const rows = await db
    .select({ r: requests, t: trips, gpName: gp.name, clientName: client.name })
    .from(requests)
    .innerJoin(trips, eq(trips.id, requests.tripId))
    .innerJoin(gp, eq(gp.id, trips.gpId))
    .innerJoin(client, eq(client.id, requests.clientId))
    .orderBy(desc(requests.createdAt))
    .limit(300);
  return (
    <div className="card">
      <h1>Demandes ({rows.length})</h1>
      {rows.map(({ r, t, gpName, clientName }) => (
        <div className="arow" key={r.id}>
          <div>
            <Link href={`/demandes/${r.id}`}>
              <b>
                {t.fromCity} → {t.toCity}
              </b>
            </Link>
            <small>
              {clientName} avec {gpName} · {r.weightKg} kg · {r.category} · {euros(r.weightKg * r.pricePerKg)} · {dateTime(r.createdAt)}
            </small>
          </div>
          <StatusPill status={r.status} />
        </div>
      ))}
    </div>
  );
}
