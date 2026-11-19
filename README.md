# Lilalink

> Lilalink, le colis entre personnes de confiance.

Application web de mise en relation entre **GP** (voyageurs qui transportent des colis) et **expéditeurs**, sur les trajets France ↔ Afrique.

- Les GP publient leurs trajets : villes, date, kilos disponibles, **prix au kilo**, **délai de livraison**, **liste d'objets refusés** (modifiable).
- Les clients cherchent un trajet, voient le total de leur colis, envoient une demande avec une description et discutent avec le GP.
- Le numéro de téléphone n'est révélé qu'une fois la demande acceptée. Le paiement se fait directement entre eux, hors plateforme.
- **Code de livraison** : le client indique qui reçoit le colis (nom + téléphone). Quand le GP accepte, le client reçoit un code à 6 chiffres qu'il transmet à son destinataire (bouton WhatsApp prérempli). À la remise, le GP tape le code donné par le destinataire : c'est la seule façon de marquer le colis comme livré. 5 essais maximum, puis le client crée un nouveau code. En cas de litige, l'admin peut valider la livraison sans code.
- Après livraison, le client note le GP (étoiles + avis).
- **Badge « GP vérifié »** : le GP envoie sa pièce d'identité, un administrateur la contrôle. La pièce est supprimée après la décision.
- **Historique** : chaque utilisateur retrouve toutes ses mises en relation passées (« Mes demandes » côté client, « Demandes reçues » côté GP).
- **Signalements** : clients et GP signalent une mauvaise expérience. L'administration répond, suspend un trajet ou un compte.
- **Administration** : tableau de bord, vérifications, signalements, trajets, demandes, utilisateurs (dont mot de passe temporaire), avis.
- **Demande d'envoi sans trajet** : si aucun trajet ne convient, l'expéditeur dépose sa demande (villes, date limite facultative, poids, type, description). Les GP la voient dans « Colis en attente » et proposent un de leurs trajets, ou en publient un. L'expéditeur choisit un GP en un clic : sa demande est déjà remplie.
- **Alertes WhatsApp** : chacun peut activer une alerte sur un parcours (ou toutes les villes). À chaque nouveau trajet publié, un message WhatsApp part aux personnes concernées (alertes et demandes d'envoi ouvertes, un seul message par personne).
- **Connexion façon Facebook** : logo et accroche, formulaire simple, « Mot de passe oublié ? », puis « Créer un nouveau compte » en bas.
- **Icône de profil en haut à droite** : passer du profil Expéditeur au profil GP (le menu change), passer d'un compte à l'autre sur le même téléphone (jusqu'à 5), ajouter un compte, se déconnecter.
- Connexion par **numéro de téléphone + mot de passe** (pas de code SMS dans cette version).
- **Mot de passe oublié** : à la création du compte, un **code de récupération** (XXXX-XXXX-XXXX) est affiché une seule fois. Avec le numéro et ce code, la personne crée un nouveau mot de passe sur `/mot-de-passe-oublie` (5 essais par 15 minutes, code à usage unique : un nouveau est donné après chaque réinitialisation, et les autres appareils sont déconnectés). Depuis « Mon compte », on peut créer un nouveau code. Les comptes créés avant cette fonction n'en ont pas encore : ils en créent un depuis « Mon compte », ou un admin leur donne un mot de passe temporaire.
- Installable sur l'écran d'accueil du téléphone (PWA), pensée pour les petits écrans et les personnes peu à l'aise avec le smartphone.

## Technique

| Élément | Choix |
| --- | --- |
| Application | Next.js 15 (App Router, Server Actions), TypeScript |
| Base de données | PostgreSQL 16, ORM Drizzle (migrations SQL dans `drizzle/`) |
| Mots de passe | bcrypt, sessions en base (cookie httpOnly, 30 jours) |
| Fichiers | Pièces d'identité sur disque privé (`UPLOAD_DIR`), lisibles uniquement par un admin |
| Déploiement | Docker + Docker Compose |

```
src/
  app/                 pages (une route = un dossier)
    actions.ts         actions serveur : trajets, demandes, avis, messages, badge, signalements
    auth-actions.ts    inscription, connexion, mot de passe
    admin-actions.ts   actions réservées à l'admin
    admin/             espace administration
    gp/                espace GP (trajets, publication, demandes reçues, badge)
    demandes/          historique et détail d'une mise en relation (discussion)
    trajets/[id]/      page publique d'un trajet + formulaire de demande
  components/          composants d'interface
  db/schema.ts         schéma de la base
  lib/                 auth, requêtes, formats, téléphone, notifications, fichiers
scripts/               migrate.mjs (migrations), seed.mjs (admin + données de démo)
```

## Démarrer en local (sans Docker)

Prérequis : Node.js 20 ou plus, PostgreSQL 16.

```bash
cp .env.example .env            # puis adaptez les valeurs
npm install
createdb gp                     # ou via psql
npm run db:migrate
npm run db:seed:demo            # admin + GP et trajets d'exemple (mot de passe démo : demo1234)
npm run dev                     # http://localhost:3000
```

Les variables de `.env` doivent être chargées dans votre shell pour les scripts (`set -a; source .env; set +a`).

Comptes de démonstration créés par `db:seed:demo` :

| Rôle | Téléphone | Mot de passe |
| --- | --- | --- |
| Admin | valeur de `ADMIN_PHONE` | valeur de `ADMIN_PASSWORD` |
| GP vérifiée | +33 6 11 11 11 11 | demo1234 |
| Cliente | +33 6 55 55 55 55 | demo1234 |

## Démarrer avec Docker

```bash
cp .env.example .env            # renseignez ADMIN_PHONE et ADMIN_PASSWORD
docker compose up -d --build
```

Au démarrage, le conteneur applique les migrations, crée le compte admin, puis lance le site sur le port 3000.

## Mettre en production

Le fichier `docker-compose.prod.yml` lance tout ce qu'il faut : l'application, PostgreSQL, **Caddy** (HTTPS automatique avec Let's Encrypt) et une **sauvegarde quotidienne** de la base dans `./backups` (14 jours conservés).

1. **Serveur** : un VPS Linux en Europe (2 Go de RAM suffisent pour démarrer), avec Docker installé (`curl -fsSL https://get.docker.com | sh`).
2. **Domaine** : créez un enregistrement DNS `A` (et `AAAA` si IPv6) de votre domaine vers l'IP du serveur, plus `www` si besoin.
3. **Pare-feu** : ouvrez seulement les ports 22, 80 et 443.
4. **Installation** :

   ```bash
   git clone https://github.com/abrahamkoivogui4-gif/GP_Projet_17112026.git lilalink
   cd lilalink
   cp .env.production.example .env
   nano .env        # DOMAIN=lilalink.fr, POSTGRES_PASSWORD, ADMIN_PHONE, ADMIN_PASSWORD
   docker compose -f docker-compose.prod.yml up -d --build
   ```

5. Ouvrez `https://lilalink.fr` et connectez-vous avec le compte admin.

**Mettre à jour** après un nouveau commit :

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Les migrations de la base s'appliquent toutes seules au démarrage.

**Restaurer une sauvegarde** :

```bash
gunzip -c backups/kola-AAAA-MM-JJ.sql.gz | docker compose -f docker-compose.prod.yml exec -T db psql -U gp gp
```

Pensez à copier régulièrement le dossier `backups/` hors du serveur (stockage objet, autre machine).

**Suivre les logs** (dont les notifications) : `docker compose -f docker-compose.prod.yml logs -f app`

## Modifier les listes

Tout est dans `src/lib/constants.ts` : villes proposées, objets refusés par défaut, délais de livraison, types de colis, motifs de signalement, indicatifs téléphoniques.

## Notifications WhatsApp

Les messages partent par l'**API officielle WhatsApp Business (Cloud API de Meta)**. Sans configuration, rien n'est envoyé : les messages sont écrits dans les logs (`[whatsapp:non-configuré]`), pratique pour tester.

1. Créez une application sur [developers.facebook.com](https://developers.facebook.com), ajoutez le produit **WhatsApp** et un numéro d'envoi (un numéro qui n'est pas déjà utilisé dans l'application WhatsApp).
2. Créez un **jeton d'accès permanent** (utilisateur système dans le Business Manager) et notez l'**identifiant du numéro** (Phone number ID).
3. Dans le WhatsApp Manager, créez le modèle de message **`nouveau_trajet`**, catégorie *Utilité*, langue *Français* :

   ```
   Nouveau trajet Lilalink : {{1}} → {{2}} le {{3}}, {{4}} par kilo. Voir et réserver : {{5}}
   Pour ne plus recevoir ces messages, désactivez l'alerte dans votre compte Lilalink.
   ```

4. (Facultatif) Un modèle **`notification`** avec un seul paramètre, pour les autres messages (demande reçue, acceptée, nouveau message…) :

   ```
   Lilalink : {{1}}
   ```

5. Renseignez dans `.env` puis relancez :

   ```
   WHATSAPP_TOKEN=...
   WHATSAPP_PHONE_NUMBER_ID=...
   WHATSAPP_TEMPLATE_NEW_TRIP=nouveau_trajet
   WHATSAPP_TEMPLATE_NOTIFICATION=notification   # laisser vide pour ne pas l'utiliser
   ```

Meta n'autorise un message à l'initiative de l'entreprise qu'avec un modèle validé (validation en quelques minutes à quelques jours), et facture chaque message selon le pays. Les erreurs d'envoi sont visibles dans les logs (`[whatsapp:erreur]`) et ne bloquent jamais l'utilisateur.

## Limites connues de cette première version

- La limite de tentatives de connexion est gardée en mémoire : elle suffit pour un seul serveur. Avec plusieurs serveurs, passez par Redis.
- La discussion se met à jour toutes les 5 secondes (pas de temps réel).
- Sans code de récupération, un admin génère un mot de passe temporaire depuis « Utilisateurs », après avoir vérifié l'identité de la personne.
- Les mentions légales, CGU et la politique de confidentialité restent à rédiger (idéalement avec un avocat) et à ajouter au site.
