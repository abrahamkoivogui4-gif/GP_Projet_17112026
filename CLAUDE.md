# Mémoire du projet Lilalink — à lire en premier

Dépôt **public** : aucune information personnelle, aucun secret, aucune adresse de serveur ici.
L'historique complet (serveur, décisions, préférences du propriétaire) est dans le `CLAUDE.md` du dépôt privé `business-hub`.

## Façon de travailler

- Répondre en **français**, simplement : le propriétaire n'est pas développeur. Une commande par bloc, instructions courtes.
- Tester pour de vrai avant de livrer : PostgreSQL local, `npm run db:migrate`, `npm run db:seed:demo` (mot de passe démo `demo1234`), `next build` + `next start`, Playwright (captures iPhone et ordinateur).
- Une branche par fonctionnalité, chacune partant de la précédente. Ne pas pousser sur `main` sans le dire.

## État des branches

En production : **`publier-pour-compte`** ; à déployer : **`textes-occident`** (contient tout sauf WhatsApp). `main` est en retard et devra recevoir toutes les branches.

Ordre : `design-epure` → `stats-visites` → `notif-email` → `trajets-defilants` → `bandeau-vitrine` → `espace-gp-vitrine` → `pages-infos` → `suppression-compte` → `etapes-demande` → `publier-pour-compte` → `mentions-particulier` → `zones-elargies` → `textes-occident`.
Mise de côté : `notif-whatsapp` (WhatsApp Business payant) → future offre Premium, ne pas l'activer gratuitement.

## Repères techniques

- Next.js 15 (App Router, Server Actions), PostgreSQL 16, Drizzle (migrations SQL dans `drizzle/`, appliquées au démarrage), Docker Compose (`docker-compose.prod.yml`), Caddy.
- Style : `src/app/globals.css` (noir et blanc, fond gris `#f5f5f7`, cartes blanches, vitrine façon boutique, pied de page en rectangle arrondi).
- Suivis visuels : `src/components/RequestSteps.tsx` (composant `Tracker` commun aux demandes et au badge vérifié).
- Notifications : `src/lib/notify.ts` (journaux), `src/lib/mail.ts` (SMTP, variables `SMTP_*`).
- Pages légales : textes dans `src/app/{mentions-legales,cgu,confidentialite}`, infos éditeur via `LEGAL_*`, `CONTACT_EMAIL`, `SOCIAL_*` (`src/lib/site.ts`). Sans `LEGAL_SIRET` : version « particulier » (adresse non publiée, LCEN art. 6-III-2) ; avec : version entreprise (+ `LEGAL_PHONE`).
- Villes : `CITY_GROUPS` dans `src/lib/constants.ts` (grandes villes seulement, par pays : Europe, Canada, États-Unis, Sénégal, Guinée, Côte d'Ivoire, Burkina Faso, Mali) ; indicatif du destinataire déduit de la ville.
- Admin : publier pour un compte (`/gp/publier?pour=ID`, réservé aux admins), suppression de compte = anonymisation (`src/app/account-actions.ts`).
- Autres sites du serveur : fichiers `caddy-extra/*.caddy` importés par le `Caddyfile` ; `scripts/installer-hub.sh` installe/met à jour le Business Hub.

## Mise à jour en production

`git pull && docker compose -f docker-compose.prod.yml up -d --build` dans le dossier de Lilalink sur le serveur.

## Pièges connus

- React 19 vide les formulaires après une action serveur : renvoyer `values` en cas d'erreur.
- Classes CSS génériques déjà utilisées (`.total`, `.wait`, `.qr`, `.kpi span`) : ne pas les réutiliser pour autre chose.
- Playwright : redirection d'action serveur → `waitForURL(..., { waitUntil: "commit" })`.
