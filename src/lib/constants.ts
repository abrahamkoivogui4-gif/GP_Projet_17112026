// Listes modifiables : villes proposées, objets refusés par défaut, délais, types de colis, signalements.

export const CITIES = [
  // France
  "Paris", "Lyon", "Marseille", "Lille", "Toulouse", "Bordeaux", "Nantes", "Strasbourg", "Rouen", "Le Havre",
  // Guinée
  "Conakry", "Kankan", "Labé", "Nzérékoré", "Kindia", "Boké", "Mamou", "Siguiri",
  // Afrique de l'Ouest
  "Dakar", "Abidjan", "Bamako", "Freetown", "Monrovia", "Bissau", "Nouakchott", "Ouagadougou",
  // Europe
  "Bruxelles", "Genève", "Madrid", "Rome", "Londres",
] as const;

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
  { code: "+224", label: "Guinée +224" },
  { code: "+221", label: "Sénégal +221" },
  { code: "+225", label: "Côte d'Ivoire +225" },
  { code: "+223", label: "Mali +223" },
  { code: "+32", label: "Belgique +32" },
  { code: "+41", label: "Suisse +41" },
  { code: "+34", label: "Espagne +34" },
  { code: "+39", label: "Italie +39" },
  { code: "+44", label: "Royaume-Uni +44" },
];

export const MAX_KG = 50;
export const MAX_PRICE = 50;
export const SESSION_DAYS = 30;
