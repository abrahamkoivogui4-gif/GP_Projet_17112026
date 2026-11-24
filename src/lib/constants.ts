// Listes modifiables : villes proposées, objets refusés par défaut, délais, types de colis, signalements.

/** Villes proposées, regroupées par pays : Europe, Canada et États-Unis d'un côté, Afrique de l'Ouest de l'autre. */
export const CITY_GROUPS: { country: string; flag: string; cc: string; cities: string[] }[] = [
  // Europe
  { country: "France", flag: "🇫🇷", cc: "+33", cities: ["Paris", "Lyon", "Marseille", "Lille", "Toulouse", "Bordeaux"] },
  { country: "Belgique", flag: "🇧🇪", cc: "+32", cities: ["Bruxelles"] },
  { country: "Suisse", flag: "🇨🇭", cc: "+41", cities: ["Genève"] },
  { country: "Espagne", flag: "🇪🇸", cc: "+34", cities: ["Madrid"] },
  { country: "Italie", flag: "🇮🇹", cc: "+39", cities: ["Rome", "Milan"] },
  { country: "Allemagne", flag: "🇩🇪", cc: "+49", cities: ["Berlin"] },
  { country: "Pays-Bas", flag: "🇳🇱", cc: "+31", cities: ["Amsterdam"] },
  { country: "Portugal", flag: "🇵🇹", cc: "+351", cities: ["Lisbonne"] },
  { country: "Royaume-Uni", flag: "🇬🇧", cc: "+44", cities: ["Londres"] },
  // Amérique du Nord
  { country: "Canada", flag: "🇨🇦", cc: "+1", cities: ["Montréal", "Toronto"] },
  { country: "États-Unis", flag: "🇺🇸", cc: "+1", cities: ["New York", "Washington", "Atlanta"] },
  // Afrique de l'Ouest
  { country: "Sénégal", flag: "🇸🇳", cc: "+221", cities: ["Dakar", "Thiès"] },
  { country: "Guinée", flag: "🇬🇳", cc: "+224", cities: ["Conakry"] },
  { country: "Côte d'Ivoire", flag: "🇨🇮", cc: "+225", cities: ["Abidjan", "Bouaké", "Yamoussoukro"] },
  { country: "Burkina Faso", flag: "🇧🇫", cc: "+226", cities: ["Ouagadougou", "Bobo-Dioulasso"] },
  { country: "Mali", flag: "🇲🇱", cc: "+223", cities: ["Bamako", "Kayes"] },
];

export const CITIES = CITY_GROUPS.flatMap((g) => g.cities) as [string, ...string[]];

/** Villes affichées en premier dans l'assistant de publication. */
export const TOP_CITIES = ["Paris", "Bruxelles", "Montréal", "New York", "Dakar", "Conakry", "Abidjan", "Ouagadougou", "Bamako", "Lyon"];

export const DEFAULT_FORBIDDEN = [
  "Médicaments sans ordonnance",
  "Argent liquide",
  "Produits inflammables",
  "Armes, couteaux",
  "Contrefaçons",
  "Liquides de plus de 1 L",
];

export const DELAYS: { label: string; days: number }[] = [
  { label: "Sous 24 h", days: 1 },
  { label: "2 à 3 jours", days: 3 },
  { label: "1 semaine", days: 7 },
  { label: "2 semaines", days: 14 },
];

export const CATEGORIES = ["Vêtements", "Alimentaire", "Électronique", "Documents", "Cosmétiques", "Autre"];

export const REPORT_TYPES = [
  "Colis perdu ou abîmé",
  "GP ou client injoignable",
  "Prix différent de l'annonce",
  "Comportement ou arnaque",
  "Autre problème",
];

export const URGENT_REPORT_TYPES = ["Comportement ou arnaque", "Colis perdu ou abîmé"];

export const COUNTRY_CODES = [
  { code: "+33", label: "France +33" },
  { code: "+221", label: "Sénégal +221" },
  { code: "+224", label: "Guinée +224" },
  { code: "+225", label: "Côte d'Ivoire +225" },
  { code: "+226", label: "Burkina Faso +226" },
  { code: "+223", label: "Mali +223" },
  { code: "+1", label: "Canada / États-Unis +1" },
  { code: "+32", label: "Belgique +32" },
  { code: "+41", label: "Suisse +41" },
  { code: "+34", label: "Espagne +34" },
  { code: "+39", label: "Italie +39" },
  { code: "+49", label: "Allemagne +49" },
  { code: "+31", label: "Pays-Bas +31" },
  { code: "+351", label: "Portugal +351" },
  { code: "+44", label: "Royaume-Uni +44" },
  // Gardés pour les comptes déjà inscrits avec ces numéros
  { code: "+232", label: "Sierra Leone +232" },
  { code: "+231", label: "Liberia +231" },
  { code: "+245", label: "Guinée-Bissau +245" },
  { code: "+222", label: "Mauritanie +222" },
];

export const MAX_KG = 50;
export const MAX_PRICE = 50;
export const SESSION_DAYS = 30;

/** Indicatif téléphonique le plus probable pour une ville (pré-remplit le numéro du destinataire). */
export function countryCodeForCity(city: string) {
  return CITY_GROUPS.find((g) => g.cities.includes(city))?.cc ?? "+33";
}
