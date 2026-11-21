import { Tracker, type Step } from "./RequestSteps";

/** Suivi de la demande de badge « GP vérifié » : envoi de la pièce, contrôle par l'équipe, badge obtenu. */
export function VerificationSteps({
  status,
  sentAt,
  decidedAt,
  adminNote,
}: {
  status: "none" | "pending" | "verified" | "refused";
  sentAt: Date | null;
  decidedAt: Date | null;
  adminNote: string;
}) {
  if (status === "refused") {
    const steps: Step[] = [
      { key: "card", label: "Envoyée", state: "done", at: sentAt },
      { key: "stop", label: "Refusée", state: "stopped", at: decidedAt },
    ];
    return (
      <Tracker
        mood="sad"
        title="Vérification refusée"
        text={`${adminNote || "La pièce n'était pas lisible ou ne correspondait pas à votre nom."} Vous pouvez en renvoyer une ci-dessous.`}
        steps={steps}
        label="Suivi du badge vérifié"
      />
    );
  }
  const sent = status !== "none";
  const ok = status === "verified";
  const steps: Step[] = [
    { key: "card", label: sent ? "Envoyée" : "À envoyer", state: sent ? "done" : "current", at: sent ? sentAt : null },
    { key: "eye", label: "Contrôle", state: ok ? "done" : sent ? "current" : "todo", at: ok ? decidedAt : null },
    { key: "badge", label: "Badge", state: ok ? "done" : "todo", at: ok ? decidedAt : null },
  ];
  if (ok)
    return (
      <Tracker
        mood="party"
        title="Vous êtes un GP vérifié !"
        text="Le badge s'affiche à côté de votre nom sur tous vos trajets. Les clients vous font davantage confiance."
        steps={steps}
        label="Suivi du badge vérifié"
      />
    );
  if (sent)
    return (
      <Tracker
        mood="go"
        emoji="search"
        title="Votre pièce est en cours de contrôle"
        text="L'équipe Lilalink vérifie votre identité. Le badge apparaîtra sur tous vos trajets dès validation."
        steps={steps}
        label="Suivi du badge vérifié"
      />
    );
  return (
    <Tracker
      mood="wait"
      emoji="id"
      title="Obtenez le badge GP vérifié"
      text="Envoyez une photo de votre pièce d'identité : ça prend une minute. Les clients font plus confiance aux GP vérifiés."
      steps={steps}
      label="Suivi du badge vérifié"
    />
  );
}
