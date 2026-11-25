import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, reviews, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { loadRequestFor } from "@/lib/requests";
import { delayLabel, euros, etaLabel, longDate } from "@/lib/format";
import { formatPhone, whatsappLink } from "@/lib/phone";
import { adminMarkDelivered, cancelRequest, regenerateCode } from "@/app/actions";
import { Chat } from "@/components/Chat";
import { DecisionForm, DeliveryCodeForm, ReviewForm } from "@/components/RequestForms";
import { StatusPill } from "@/components/StatusPill";
import { RequestSteps } from "@/components/RequestSteps";
import { PriceOffer } from "@/components/PriceOffer";
import { currentPrice, pendingOffer } from "@/lib/offer";
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
  const price = currentPrice(r);
  const offer = pendingOffer(r);
  const total = r.weightKg * price;

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
        {r.recipientName && (
          <p>
            Destinataire à l&apos;arrivée : <b>{r.recipientName}</b>
            {(st === "accepted" || st === "delivered") && side !== "client" ? ` · ${formatPhone(r.recipientPhone)}` : ""}
          </p>
        )}
        <div className="total">
          <span>
            {r.weightKg} kg × {price} €{offer ? ` (proposé par ${offer.by === side ? "vous" : offer.by === "gp" ? gp.name : client.name})` : ""}
            <br />
            <small className="tag">
              Livraison sous {delayLabel(t.deliveryDays)}, au plus tard le {etaLabel(t.departureDate, t.deliveryDays)}
            </small>
          </span>
          <b>{euros(total)}</b>
        </div>

        <RequestSteps
          status={st}
          createdAt={r.createdAt}
          decidedAt={r.decidedAt}
          deliveredAt={r.deliveredAt}
          reviewedAt={review?.createdAt ?? null}
          gpName={gp.name}
          recipientName={r.recipientName}
          side={side}
          departureDate={t.departureDate}
          deliveryDays={t.deliveryDays}
          offerBy={offer?.by ?? null}
        />

        {/* En attente */}
        {st === "pending" && (side === "client" || side === "gp") && (
          <PriceOffer
            key={`${r.offerBy}-${r.offerPricePerKg}`}
            id={r.id}
            side={side}
            adPrice={r.pricePerKg}
            offer={offer}
            weightKg={r.weightKg}
            otherName={other.name}
          />
        )}
        {st === "pending" && side === "client" && (
          <>
            {offer?.by !== "gp" && <p className="warn">En attente de la réponse de {gp.name}.</p>}
            <form action={cancelRequest}>
              <input type="hidden" name="id" value={r.id} />
              <SubmitButton className="btn no small">Annuler ma demande</SubmitButton>
            </form>
          </>
        )}
        {st === "pending" && side === "gp" && (
          <DecisionForm id={r.id} canAccept={offer?.by !== "gp"} acceptLabel={offer ? `Accepter à ${offer.price} €/kg` : undefined} />
        )}

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
            {other.phone.startsWith("supprime-") ? (
              <p className="note">Cette personne a supprimé son compte : ses coordonnées ne sont plus disponibles.</p>
            ) : (
            <div className="contact">
              <b>Contact de {other.name}</b>
              <span className="num">{formatPhone(other.phone)}</span>
              {st === "accepted" && <span>Appelez ou écrivez pour fixer le lieu de remise.</span>}
              <a className="btn sun small" target="_blank" rel="noopener noreferrer" href={whatsappLink(other.phone)}>
                Écrire sur WhatsApp
              </a>
            </div>
            )}
          </>
        )}
        {st === "accepted" && (
          <>
            <p className="warn">
              Le paiement se fait directement entre vous. Ne payez jamais la totalité avant d&apos;avoir rencontré l&apos;autre personne, et vérifiez le colis ensemble.
            </p>

            {/* Côté client : le code à transmettre au destinataire */}
            {side === "client" && (
              <div className="codebox">
                <b>Code de livraison</b>
                {r.deliveryCode ? (
                  <>
                    <span className="code" aria-label={`Code ${r.deliveryCode.split("").join(" ")}`}>
                      {r.deliveryCode.slice(0, 3)} {r.deliveryCode.slice(3)}
                    </span>
                    <span>
                      Transmettez ce code à <b>{r.recipientName || "votre destinataire"}</b>, et à personne d&apos;autre. {gp.name} le lui demandera au moment de la
                      remise : sans ce code, la livraison ne peut pas être validée.
                    </span>
                    {r.recipientPhone && (
                      <a
                        className="btn sun small"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={whatsappLink(
                          r.recipientPhone,
                          `Bonjour ${r.recipientName}, ${gp.name} va t'apporter un colis de ma part (${t.fromCity} → ${t.toCity}). Quand tu le reçois, donne-lui ce code : ${r.deliveryCode}. Ne le donne à personne d'autre.`,
                        )}
                      >
                        Envoyer le code à {r.recipientName} sur WhatsApp
                      </a>
                    )}
                    {r.codeAttempts >= 5 && <p className="err">Trop d&apos;essais ratés avec ce code. Créez-en un nouveau et redonnez-le au destinataire.</p>}
                  </>
                ) : (
                  <span>Créez votre code et transmettez-le à la personne qui recevra le colis.</span>
                )}
                <form action={regenerateCode}>
                  <input type="hidden" name="id" value={r.id} />
                  <SubmitButton className="btn alt small">{r.deliveryCode ? "Créer un nouveau code" : "Créer mon code de livraison"}</SubmitButton>
                </form>
                {r.deliveryCode && <p className="hint">Si vous créez un nouveau code, l&apos;ancien ne marchera plus.</p>}
              </div>
            )}

            {/* Côté GP : contacter le destinataire puis saisir son code */}
            {side === "gp" && (
              <>
                {r.recipientPhone && (
                  <div className="contact">
                    <b>Destinataire : {r.recipientName}</b>
                    <span className="num">{formatPhone(r.recipientPhone)}</span>
                    <a className="btn sun small" target="_blank" rel="noopener noreferrer" href={whatsappLink(r.recipientPhone)}>
                      Écrire au destinataire sur WhatsApp
                    </a>
                  </div>
                )}
                <DeliveryCodeForm id={r.id} recipient={r.recipientName || "le destinataire"} />
              </>
            )}

            {side === "admin" && (
              <form action={adminMarkDelivered}>
                <input type="hidden" name="id" value={r.id} />
                <SubmitButton className="btn alt small">Marquer comme livré sans code (litige)</SubmitButton>
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
