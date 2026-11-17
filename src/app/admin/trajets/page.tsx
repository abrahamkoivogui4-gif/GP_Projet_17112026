import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { trips, users } from "@/db/schema";
import { delayLabel, shortDate } from "@/lib/format";
import { setTripStatus } from "@/app/admin-actions";
import { StatusPill } from "@/components/StatusPill";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata = { title: "Trajets" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const rows = await db
    .select({ t: trips, gpName: users.name, verified: users.verification })
    .from(trips)
    .innerJoin(users, eq(users.id, trips.gpId))
    .orderBy(desc(trips.departureDate))
    .limit(300);
  return (
    <div className="card">
      <h1>Trajets ({rows.length})</h1>
      {rows.map(({ t, gpName, verified }) => (
        <div className="arow" key={t.id}>
          <div>
            <Link href={`/trajets/${t.id}`}>
              <b>
                {t.fromCity} → {t.toCity}
              </b>
            </Link>{" "}
            <StatusPill kind="trip" status={t.status} />
            <small>
              {gpName} {verified === "verified" ? "(vérifié)" : "(non vérifié)"} · {shortDate(t.departureDate)} · {t.capacityKg} kg · {t.pricePerKg} €/kg · livraison sous{" "}
              {delayLabel(t.deliveryDays)}
            </small>
          </div>
          {t.status !== "cancelled" && (
            <form action={setTripStatus}>
              <input type="hidden" name="id" value={t.id} />
              <input type="hidden" name="status" value={t.status === "active" ? "suspended" : "active"} />
              <SubmitButton className={`btn small ${t.status === "active" ? "no" : "alt"}`}>{t.status === "active" ? "Suspendre" : "Réactiver"}</SubmitButton>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}
