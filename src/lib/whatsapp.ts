import "server-only";

/**
 * Envoi de messages WhatsApp via l'API officielle WhatsApp Business (Meta Cloud API).
 *
 * WhatsApp n'autorise une entreprise à écrire la première qu'avec un « modèle » de message
 * validé par Meta. Le modèle attendu (par défaut « nouvelle_demande », en français) contient
 * 4 variables : {{1}} nom du client, {{2}} kilos, {{3}} trajet, {{4}} lien vers la demande.
 *
 * Variables d'environnement :
 *   WHATSAPP_TOKEN            jeton d'accès permanent (utilisateur système Meta Business)
 *   WHATSAPP_PHONE_NUMBER_ID  identifiant du numéro d'envoi (pas le numéro lui-même)
 *   WHATSAPP_TEMPLATE         nom du modèle (défaut : nouvelle_demande)
 *   WHATSAPP_TEMPLATE_LANG    langue du modèle (défaut : fr)
 * Sans jeton ni identifiant, rien n'est envoyé : le message est seulement écrit dans les logs.
 */

export function whatsappConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export type NewRequestParams = { clientName: string; kg: number; route: string; url: string };

export async function sendNewRequestWhatsapp(to: string, p: NewRequestParams): Promise<{ ok: boolean; error?: string }> {
  const params = [p.clientName, String(p.kg), p.route, p.url];
  if (!whatsappConfigured()) {
    console.info(`[whatsapp non configuré] ${to} : ${params.join(" | ")}`);
    return { ok: false, error: "non configuré" };
  }
  const version = process.env.WHATSAPP_API_VERSION || "v21.0";
  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/\D/g, ""),
        type: "template",
        template: {
          name: process.env.WHATSAPP_TEMPLATE || "nouvelle_demande",
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "fr" },
          components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text: text.slice(0, 200) })) }],
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[whatsapp] échec ${res.status} vers ${to} : ${body.slice(0, 300)}`);
      return { ok: false, error: `WhatsApp a refusé l'envoi (${res.status}).` };
    }
    console.info(`[whatsapp] envoyé à ${to}`);
    return { ok: true };
  } catch (e) {
    console.error(`[whatsapp] erreur vers ${to} :`, e);
    return { ok: false, error: "WhatsApp ne répond pas." };
  }
}
