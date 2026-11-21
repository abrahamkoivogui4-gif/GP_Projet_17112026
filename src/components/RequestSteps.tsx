import { etaLabel } from "@/lib/format";

type State = "done" | "current" | "todo" | "stopped";
type Step = { key: string; label: string; state: State; at?: Date | null };

const day = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });

/** Petites icônes dessinées (traits arrondis), lisibles à toutes les tailles. */
function Icon({ name }: { name: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    send: <path {...p} d="M4 12l16-7-6 16-3-7-7-2zM11 14l9-9" />,
    ok: <path {...p} d="M5 12.5l4.5 4.5L19 7.5" />,
    hand: (
      <>
        <rect {...p} x="4" y="8" width="16" height="11" rx="2" />
        <path {...p} d="M4 12h16M12 8v11M9 8c-2-3 1-5 3 0 2-5 5-3 3 0" />
      </>
    ),
    home: <path {...p} d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" />,
    star: <path {...p} d="M12 4l2.5 5 5.5.8-4 3.9.9 5.5L12 16.6 7.1 19.2 8 13.7 4 9.8l5.5-.8z" />,
    stop: <path {...p} d="M7 7l10 10M17 7L7 17" />,
  };
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      {paths[name]}
    </svg>
  );
}

/**
 * Suivi d'une demande, façon suivi de colis : un message clair sur l'étape en cours,
 * un parcours avec une icône par étape (vert = fait, noir qui pulse = en cours) et la date de chaque validation.
 */
export function RequestSteps({
  status,
  createdAt,
  decidedAt,
  deliveredAt,
  reviewedAt,
  gpName,
  recipientName,
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
  recipientName: string;
  side: "client" | "gp" | "admin";
  departureDate: string;
  deliveryDays: number;
}) {
  const you = side === "client";
  const gpFirst = gpName.split(" ")[0];
  const to = recipientName ? recipientName.split(" ")[0] : "Le destinataire";
  const accepted = status === "accepted" || status === "delivered";
  const delivered = status === "delivered";
  const stopped = status === "refused" || status === "cancelled";

  const steps: Step[] = stopped
    ? [
        { key: "send", label: "Envoyée", state: "done", at: createdAt },
        { key: "stop", label: status === "refused" ? "Refusée" : "Annulée", state: "stopped", at: decidedAt },
      ]
    : [
        { key: "send", label: "Envoyée", state: "done", at: createdAt },
        { key: "ok", label: accepted ? "Acceptée" : "Réponse", state: accepted ? "done" : "current", at: accepted ? decidedAt : null },
        { key: "hand", label: "Remise", state: delivered ? "done" : accepted ? "current" : "todo" },
        { key: "home", label: "Livrée", state: delivered ? "done" : "todo", at: deliveredAt },
        { key: "star", label: "Avis", state: reviewedAt ? "done" : delivered ? "current" : "todo", at: reviewedAt },
      ];

  // Le grand message : ce qui se passe maintenant, et quoi faire.
  let mood: "wait" | "go" | "party" | "sad" = "wait";
  let title = "";
  let text = "";
  if (status === "refused") {
    mood = "sad";
    title = you ? `${gpFirst} ne peut pas prendre votre colis` : "Demande refusée";
    text = you ? "Pas de souci : d'autres GP font peut-être le même trajet." : "Le client a été prévenu.";
  } else if (status === "cancelled") {
    mood = "sad";
    title = "Demande annulée";
    text = "Cette demande n'est plus active.";
  } else if (status === "pending") {
    title = you ? `En attente de ${gpFirst}` : "Nouvelle demande pour vous";
    text = you ? "Votre demande est bien arrivée. Vous serez prévenu dès sa réponse." : "Lisez la demande puis acceptez ou refusez.";
  } else if (status === "accepted") {
    mood = "go";
    title = you ? `${gpFirst} a accepté votre colis !` : "Vous avez accepté ce colis";
    text = you
      ? `Retrouvez ${gpFirst} pour lui remettre le colis. Livraison prévue au plus tard le ${etaLabel(departureDate, deliveryDays)}.`
      : `À la remise, demandez le code à 6 chiffres à ${to}. Livraison au plus tard le ${etaLabel(departureDate, deliveryDays)}.`;
  } else if (delivered) {
    mood = "party";
    title = you ? `Livré ! ${to} a bien reçu le colis` : "Colis livré, bravo !";
    text = reviewedAt ? "Merci pour votre avis." : you ? `Un petit avis pour ${gpFirst} ? Ça aide les autres expéditeurs.` : "Le client peut maintenant vous laisser un avis.";
  }

  const done = steps.filter((s) => s.state === "done").length;
  const pct = stopped ? 100 : Math.round(((done - 1 + (steps.some((s) => s.state === "current") ? 0.5 : 0)) / (steps.length - 1)) * 100);

  return (
    <section className={`track t-${mood}`} aria-label="Suivi de la demande">
      <div className="track-hero">
        <span className="track-emoji" aria-hidden>
          {mood === "party" ? "🎉" : mood === "go" ? "📦" : mood === "sad" ? "😕" : "⏳"}
        </span>
        <div>
          <p className="track-title">{title}</p>
          <p className="track-text">{text}</p>
        </div>
      </div>
      <ol className="track-line" style={{ ["--pct" as string]: Math.max(0, Math.min(100, pct)), ["--n" as string]: steps.length }}>
        {steps.map((s) => (
          <li key={s.key} className={s.state} aria-current={s.state === "current" ? "step" : undefined}>
            <span className="track-dot">
              <Icon name={s.key} />
            </span>
            <span className="track-label">{s.label}</span>
            <span className="track-date">{s.at ? day(s.at) : s.state === "current" ? "en cours" : " "}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
