import { dateTime, etaLabel } from "@/lib/format";

type Step = { title: string; detail: string; state: "done" | "current" | "todo" | "stopped"; at?: Date | null };

/**
 * Barre d'étapes d'une demande : ce qui est fait (avec la date), l'étape en cours, ce qui reste.
 * Une demande refusée ou annulée s'arrête sur une étape rouge.
 */
export function RequestSteps({
  status,
  createdAt,
  decidedAt,
  deliveredAt,
  reviewedAt,
  gpName,
  side,
  departureDate,
  deliveryDays,
}: {
  status: string;
  createdAt: Date;
  decidedAt: Date | null;
  deliveredAt: Date | null;
  reviewedAt: Date | null;
  gpName: string;
  side: "client" | "gp" | "admin";
  departureDate: string;
  deliveryDays: number;
}) {
  const you = side === "client";
  const steps: Step[] = [{ title: "Demande envoyée", detail: you ? "Votre demande est arrivée chez le GP." : "Le client a envoyé sa demande.", state: "done", at: createdAt }];

  if (status === "refused" || status === "cancelled") {
    steps.push({
      title: status === "refused" ? `Refusée par ${gpName}` : "Demande annulée",
      detail: status === "refused" ? "Vous pouvez chercher un autre GP sur le même trajet." : "Cette demande n'est plus active.",
      state: "stopped",
      at: decidedAt,
    });
  } else {
    const accepted = status === "accepted" || status === "delivered";
    const delivered = status === "delivered";
    steps.push({
      title: accepted ? `Acceptée par ${gpName}` : `Réponse de ${gpName}`,
      detail: accepted
        ? you
          ? "Vous avez reçu le code de livraison. Le numéro du GP est visible."
          : "Le code de livraison a été envoyé au client."
        : you
          ? "Le GP lit votre demande. Vous serez prévenu de sa réponse."
          : "À vous d'accepter ou de refuser.",
      state: accepted ? "done" : "current",
      at: accepted ? decidedAt : null,
    });
    steps.push({
      title: "Remise du colis au GP",
      detail: "Vous vous retrouvez pour la remise et le paiement, au prix convenu.",
      state: delivered ? "done" : accepted ? "current" : "todo",
      at: null,
    });
    steps.push({
      title: "Livré au destinataire",
      detail: delivered
        ? "Le destinataire a donné le bon code au GP."
        : `Le destinataire donne le code à 6 chiffres au GP. Prévu au plus tard le ${etaLabel(departureDate, deliveryDays)}.`,
      state: delivered ? "done" : "todo",
      at: deliveredAt,
    });
    steps.push({
      title: "Avis",
      detail: reviewedAt ? "Merci pour votre avis !" : you ? "Notez le GP pour aider les autres expéditeurs." : "Le client peut laisser un avis.",
      state: reviewedAt ? "done" : delivered ? "current" : "todo",
      at: reviewedAt,
    });
  }

  const doneCount = steps.filter((s) => s.state === "done").length;
  return (
    <section className="rsteps" aria-label="Avancement de la demande">
      <div className="rsteps-head">
        <b>Avancement</b>
        <span>
          {doneCount} / {steps.length} étape{steps.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="rsteps-bar" aria-hidden>
        {steps.map((s, i) => (
          <i key={i} className={s.state} />
        ))}
      </div>
      <ol>
        {steps.map((s, i) => (
          <li key={i} className={s.state} aria-current={s.state === "current" ? "step" : undefined}>
            <span className="rdot" aria-hidden>
              {s.state === "done" ? "✓" : s.state === "stopped" ? "✕" : i + 1}
            </span>
            <div>
              <p className="rtitle">
                {s.title}
                {s.state === "current" && <span className="rnow">En cours</span>}
              </p>
              {s.at && <p className="rdate">{s.state === "stopped" ? "Le" : "Validé le"} {dateTime(s.at)}</p>}
              <p className="rdetail">{s.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
