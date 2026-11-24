import "server-only";

/**
 * Informations de l'éditeur du site (mentions légales, contact, réseaux sociaux).
 * Elles se règlent dans le fichier .env du serveur, sans toucher au code.
 * Une valeur manquante s'affiche « à compléter » sur les pages légales.
 *
 * Sans numéro SIRET (LEGAL_SIRET vide), le site est présenté comme édité par un particulier :
 * l'adresse n'est pas publiée (elle est connue de l'hébergeur, art. 6-III-2 de la LCEN).
 * Dès qu'un SIRET est renseigné, les pages passent en version entreprise.
 */
export function siteInfo() {
  const e = (k: string) => (process.env[k] ?? "").trim();
  return {
    legalName: e("LEGAL_NAME"), // nom de la personne ou de la société
    legalForm: e("LEGAL_FORM"), // ex. « Entrepreneur individuel », « SAS au capital de 1 000 € »
    legalAddress: e("LEGAL_ADDRESS"),
    legalId: e("LEGAL_SIRET"), // SIREN / SIRET ou numéro d'immatriculation
    publisher: e("PUBLICATION_DIRECTOR") || e("LEGAL_NAME"), // directeur de la publication
    contactEmail: e("CONTACT_EMAIL"),
    contactPhone: e("LEGAL_PHONE"), // téléphone de contact (obligatoire pour un professionnel)
    isCompany: e("LEGAL_SIRET") !== "",
    socials: [
      { key: "facebook", label: "Facebook", url: e("SOCIAL_FACEBOOK") },
      { key: "tiktok", label: "TikTok", url: e("SOCIAL_TIKTOK") },
      { key: "whatsapp", label: "WhatsApp", url: e("SOCIAL_WHATSAPP") },
    ].filter((s) => /^https:\/\//.test(s.url)),
  };
}

export const LEGAL_UPDATED = "21 novembre 2026";
