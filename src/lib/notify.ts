import "server-only";
import { shortDate } from "./format";
import { sendWhatsAppTemplate } from "./whatsapp";

const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

export function appLink(path: string) {
  return `${APP_URL}${path}`;
}

/**
 * Point d'entrée unique pour prévenir un utilisateur (demande reçue, acceptée, refusée…).
 * Écrit toujours dans les logs. Si un modèle WhatsApp générique est configuré
 * (WHATSAPP_TEMPLATE_NOTIFICATION, avec un seul paramètre {{1}}), le message part aussi sur WhatsApp.
 */
export async function notify(phone: string, message: string) {
  console.info(`[notification] ${phone} : ${message}`);
  const template = process.env.WHATSAPP_TEMPLATE_NOTIFICATION;
  if (template) await sendWhatsAppTemplate(phone, template, [message], message);
}

type TripInfo = { id: number; fromCity: string; toCity: string; departureDate: string; pricePerKg: number; gpName: string };

/**
 * Alerte « nouveau trajet », envoyée uniquement aux personnes qui l'ont activée (alerte WhatsApp ou demande d'envoi).
 * Modèle WHATSAPP_TEMPLATE_NEW_TRIP (par défaut « nouveau_trajet ») :
 *   {{1}} ville de départ · {{2}} destination · {{3}} date · {{4}} prix au kilo · {{5}} lien
 */
export async function notifyNewTrip(phone: string, t: TripInfo, path = `/trajets/${t.id}`) {
  const date = shortDate(t.departureDate);
  const link = appLink(path);
  const text = `Nouveau trajet ${t.fromCity} → ${t.toCity} le ${date} avec ${t.gpName}, ${t.pricePerKg} €/kg : ${link}`;
  await sendWhatsAppTemplate(
    phone,
    process.env.WHATSAPP_TEMPLATE_NEW_TRIP ?? "nouveau_trajet",
    [t.fromCity, t.toCity, date, `${t.pricePerKg} €`, link],
    text,
  );
}
