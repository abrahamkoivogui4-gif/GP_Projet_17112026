import "server-only";

/**
 * Envoi de messages WhatsApp par l'API officielle WhatsApp Business (Cloud API de Meta).
 *
 * Sans configuration (WHATSAPP_TOKEN et WHATSAPP_PHONE_NUMBER_ID vides), rien n'est envoyé :
 * les messages sont seulement écrits dans les logs du serveur. Pratique en local et pour tester.
 *
 * Meta n'autorise un message à l'initiative de l'entreprise qu'avec un « modèle » (template) validé
 * dans le WhatsApp Manager. Voir le README, partie « Notifications WhatsApp ».
 */

const TOKEN = process.env.WHATSAPP_TOKEN ?? "";
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
const VERSION = process.env.WHATSAPP_API_VERSION || "v22.0";
const LANG = process.env.WHATSAPP_TEMPLATE_LANG || "fr";

export function whatsappEnabled() {
  return Boolean(TOKEN && PHONE_ID);
}

/** Les paramètres d'un modèle ne peuvent contenir ni retour à la ligne, ni tabulation, ni plus de 4 espaces de suite. */
function clean(v: string) {
  return v.replace(/[\n\t]+/g, " ").replace(/ {4,}/g, "   ").trim().slice(0, 900) || "-";
}

/**
 * Envoie un modèle WhatsApp validé. `params` remplit {{1}}, {{2}}… dans l'ordre.
 * Ne lève jamais d'erreur : un échec d'envoi ne doit pas bloquer l'action de l'utilisateur.
 */
export async function sendWhatsAppTemplate(phone: string, template: string, params: string[], logText: string) {
  if (!whatsappEnabled() || !template) {
    console.info(`[whatsapp:non-configuré] ${phone} : ${logText}`);
    return false;
  }
  try {
    const res = await fetch(`https://graph.facebook.com/${VERSION}/${PHONE_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone.replace(/\D/g, ""),
        type: "template",
        template: {
          name: template,
          language: { code: LANG },
          components: params.length ? [{ type: "body", parameters: params.map((text) => ({ type: "text", text: clean(text) })) }] : [],
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[whatsapp:erreur ${res.status}] ${phone} : ${(await res.text()).slice(0, 300)}`);
      return false;
    }
    console.info(`[whatsapp:envoyé] ${phone} : ${template}`);
    return true;
  } catch (e) {
    console.error(`[whatsapp:erreur] ${phone} : ${(e as Error).message}`);
    return false;
  }
}
