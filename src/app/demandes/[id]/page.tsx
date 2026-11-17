import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, reviews, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { loadRequestFor } from "@/lib/requests";
import { delayLabel, euros, etaLabel, longDate } from "@/lib/format";
import { formatPhone, whatsappLink } from "@/lib/phone";
import { cancelRequest, markDelivered } from "@/app/actions";
import { Chat } from "@/components/Chat";
import { DecisionForm, ReviewForm } from "@/components/RequestForms";
import { StatusPill } from "@/components/StatusPill";
import { Stars } from "@/components/Stars";
import { TripRoute } from "@/components/TripCard";
import { SubmitButton } from "@/components/SubmitButton";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export const metadata = { title: "Demande" };
export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ envoyee?: string }> }) {
  const id = Number((await params).id) || 0;
  const u = await requireUser(`/demandes/${id}`);
  const row = await loadRequestFor(u, id);
  if (!row) notFound();
  const { r, t, side } = row;
  const { envoyee } = await searchParams;

  const [gp, client, msgs, review] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, t.gpId), columns: { id: true, name: true, phone: true, verification: true } }),
    db.query.users.findFirst({ where: eq(users.id, r.clientId), columns: { id: true, name: true, phone: true } }),
    db
      .select({ id: messages.id, senderId: messages.senderId, body: messages.body, createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.requestId, r.id))
      .orderBy(asc(messages.id)),
    db.query.reviews.findFirst({ where: eq(reviews.requestId, r.id) }),
  ]);
  if (!gp || !client) notFound();

  const other = side === "gp" ? client : gp;
  const st = r.status;
  const total = r.weightKg * r.pricePerKg;
  const ORDER: Record<string, number> = { pending: 0, accepted: 1, delivered: 2 };
  const reached = (s: string) => (ORDER[st] ?? -1) >= ORDER[s];

  return (
    <>
      <Link href={side === "gp" ? "/gp/demandes" : side === "admin" ? "/admin" : "/demandes"} className="link">
        ← Retour
      </Link>
      {envoyee && <p className="info">Demande envoyée. {gp.name} va vous répondre ici.</p>}
      <article className="trip">
        <TripRoute from={t.fromCity} to={t.toCity} />
        <p>
          <StatusPill status={st} /> · {side === "gp" ? "Client" : "GP"} : <b>{other.name}</b>{" "}
          {side !== "gp" && gp.verification === "verified" && <VerifiedBadge />} · départ {longDate(t.departureDate)}
        </p>
        <div className="note">
          <b>
            Colis : {r.weightKg} kg · {r.category}
          </b>
          {r.description || "Pas de description"}
        </div>
        <div className="total">
          <span>
            {r.weightKg} kg × {r.pricePerKg} €
            <br />
            <small className="tag">
              Livraison sous {delayLabel(t.deliveryDays)}, au plus tard le {etaLabel(t.departureDate, t.deliveryDays)}
            </small>
          </span>
          <b>{euros(total)}</b>
        </div>

        {(st === "pending" || st === "accepted" || st === "delivered") && (
          <div className="status">
            <span className="on">Demande envoyée</span>
            <span className={reached("accepted") ? "on" : ""}>Validée</span>
            <span className={reached("delivered") ? "on" : ""}>Livrée</span>
          </div>
        )}

        {/* En attente */}
        {st === "pending" && side === "client" && (
          <>
            <p className="warn">En attente de la réponse de {gp.name}.</p>
            <form action={cancelRequest}>
              <input type="hidden" name="id" value={r.id} />
              <SubmitButton className="btn no small">Annuler ma demande</SubmitButton>
            </form>
          </>
        )}
        {st === "pending" && side === "gp" && <DecisionForm id={r.id} />}

        {/* Refusée / annulée */}
        {st === "refused" && (
          <div className="note bad">
            <b>Demande refusée par {gp.name}</b>
            {r.gpNote || "Aucune explication ajoutée."}
          </div>
        )}
        {st === "refused" && side === "client" && (
          <Link className="btn alt small" href={`/?de=${encodeURIComponent(t.fromCity)}&vers=${encodeURIComponent(t.toCity)}`}>
            Chercher un autre GP
          </Link>
        )}
        {st === "cancelled" && <p className="note bad">Cette demande a été annulée.</p>}

        {/* Validée : les numéros sont visibles */}
        {(st === "accepted" || st === "delivered") && (
          <>
            {r.gpNote && side === "client" && (
              <div className="note">
                <b>Message de {gp.name}</b>
                {r.gpNote}
              </div>
            )}
            <div className="contact">
              <b>Contact de {other.name}</b>
              <span className="num">{formatPhone(other.phone)}</span>
              {st === "accepted" && <span>Appelez ou écrivez pour fixer le lieu de remise.</span>}
              <a className="btn sun small" target="_blank" rel="noopener noreferrer" href={whatsappLink(other.phone)}>
                Écrire sur WhatsApp
              </a>
            </div>
          </>
        )}
        {st === "accepted" && (
          <>
            <p className="warn">
              Le paiement se fait directement entre vous. Ne payez jamais la totalité avant d&apos;avoir rencontré l&apos;autre personne, et vérifiez le colis ensemble.
            </p>
            {side !== "admin" && (
              <form action={markDelivered}>
                <input type="hidden" name="id" value={r.id} />
                <SubmitButton>Le colis est livré</SubmitButton>
              </form>
            )}
          </>
        )}

        {/* Livrée : avis */}
        {st === "delivered" &&
          (review ? (
            <div className="rev">
              <Stars value={review.stars} /> Avis de {client.name}
              <br />
              {review.comment || <small>Sans commentaire</small>}
            </div>
          ) : side === "client" ? (
            <ReviewForm id={r.id} gpName={gp.name} />
          ) : (
            <p className="tag">En attente de l&apos;avis du client.</p>
          ))}

        {(st !== "refused" && st !== "cancelled") || msgs.length > 0 ? (
          <Chat
            requestId={r.id}
            meId={u.id}
            otherName={side === "admin" ? `${client.name} / ${gp.name}` : other.name}
            initial={msgs.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
            canWrite={side !== "admin" && (st === "pending" || st === "accepted" || st === "delivered")}
            status={st}
            quick={side === "client" && st === "pending"}
          />
        ) : null}
      </article>
      {side !== "admin" && (
        <Link className="link" href={`/signaler?sujet=r${r.id}`}>
          Signaler un problème avec {other.name}
        </Link>
      )}
    </>
  );
}
