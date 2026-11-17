import { DELAYS } from "./constants";

const TZ = "Europe/Paris";

/** "2026-12-05" -> objet Date à midi pour éviter les décalages de fuseau */
function parseDay(iso: string) {
  return new Date(`${iso}T12:00:00Z`);
}

export function longDate(iso: string) {
  return parseDay(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

export function shortDate(iso: string) {
  return parseDay(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" });
}

export function dateTime(d: Date) {
  return d.toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

export function addDays(iso: string, n: number) {
  const d = parseDay(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function todayIso() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ }); // AAAA-MM-JJ
}

export function delayLabel(days: number) {
  const d = DELAYS.find((x) => x.days === days);
  return d ? d.label.replace("Sous ", "").toLowerCase() : `${days} jours`;
}

export function etaLabel(departureDate: string, deliveryDays: number) {
  return shortDate(addDays(departureDate, deliveryDays));
}

export function euros(n: number) {
  return `${n.toLocaleString("fr-FR")} €`;
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  accepted: "Validée",
  refused: "Refusée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export const REPORT_STATUS_LABELS: Record<string, string> = {
  new: "Reçu",
  in_progress: "En cours",
  closed: "Traité",
};
