import { COUNTRY_CODES } from "./constants";

/** Transforme indicatif + numéro national en format international (+33612345678). Renvoie null si invalide. */
export function normalizePhone(countryCode: string, national: string): string | null {
  if (!COUNTRY_CODES.some((c) => c.code === countryCode)) return null;
  let digits = national.replace(/\D/g, "");
  // Si la personne a tapé l'indicatif dans le champ (0033… ou 33…), on le retire.
  const cc = countryCode.slice(1);
  if (digits.startsWith("00" + cc)) digits = digits.slice(2 + cc.length);
  else if (digits.startsWith(cc) && digits.length > 9 + cc.length - 1) digits = digits.slice(cc.length);
  digits = digits.replace(/^0+/, "");
  if (digits.length < 8 || digits.length > 10) return null;
  return countryCode + digits;
}

/** +33612345678 -> "+33 6 12 34 56 78" (affichage lisible) */
export function formatPhone(e164: string) {
  const cc = COUNTRY_CODES.map((c) => c.code)
    .sort((a, b) => b.length - a.length)
    .find((c) => e164.startsWith(c));
  if (!cc) return e164;
  const rest = e164.slice(cc.length);
  const groups = rest.length === 9 ? [rest.slice(0, 1), ...(rest.slice(1).match(/.{1,2}/g) ?? [])] : rest.match(/.{1,3}/g) ?? [];
  return `${cc} ${groups.join(" ")}`;
}

/** Lien WhatsApp (wa.me) à partir d'un numéro international */
export function whatsappLink(e164: string, text?: string) {
  const base = `https://wa.me/${e164.replace(/\D/g, "")}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
