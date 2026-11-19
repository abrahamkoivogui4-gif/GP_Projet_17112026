import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { tripAlerts } from "@/db/schema";
import { createAlert, deleteAlert } from "@/app/parcel-actions";
import { requireUser } from "@/lib/auth";
import { CITIES } from "@/lib/constants";
import { formatPhone } from "@/lib/phone";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata = { title: "Alertes WhatsApp" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ alerte?: string }> }) {
  const u = await requireUser("/alertes");
  const { alerte } = await searchParams;
  const list = await db.select().from(tripAlerts).where(eq(tripAlerts.userId, u.id)).orderBy(desc(tripAlerts.createdAt));

  return (
    <>
      <div>
        <h1>Alertes WhatsApp</h1>
        <p className="lead">
          À chaque nouveau trajet publié sur le parcours choisi, vous recevez un message WhatsApp au <b>{formatPhone(u.phone)}</b>.
        </p>
      </div>
      {alerte && <p className="info">✅ Alerte activée.</p>}

      <h2>Mes alertes ({list.length})</h2>
      {list.length === 0 && <p className="tag">Aucune alerte pour l&apos;instant.</p>}
      {list.map((a) => (
        <div className="trip" key={a.id}>
          <div className="between">
            <b>
              {a.fromCity ?? "Toutes les villes"} → {a.toCity ?? "Toutes les villes"}
            </b>
            <form action={deleteAlert}>
              <input type="hidden" name="id" value={a.id} />
              <SubmitButton className="btn no small auto" pendingText="…">
                Arrêter
              </SubmitButton>
            </form>
          </div>
        </div>
      ))}

      <form action={createAlert} className="card">
        <h2>Nouvelle alerte</h2>
        <input type="hidden" name="back" value="/alertes" />
        <div className="row">
          <div className="field">
            <label htmlFor="fromCity">Départ</label>
            <select id="fromCity" name="fromCity" defaultValue="">
              <option value="">Toutes les villes</option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="toCity">Arrivée</label>
            <select id="toCity" name="toCity" defaultValue="">
              <option value="">Toutes les villes</option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <SubmitButton className="btn wa-btn">Activer l&apos;alerte WhatsApp</SubmitButton>
      </form>
      <p className="tag">
        Vous avez déposé une <Link href="/demandes">demande d&apos;envoi</Link> ? Vous êtes déjà prévenu pour son parcours, sans rien faire de plus.
      </p>
    </>
  );
}
