# Kola

> Kola, le colis entre personnes de confiance.

Application web de mise en relation entre **GP** (voyageurs qui transportent des colis) et **expéditeurs**, sur les trajets France ↔ Afrique.

- Les GP publient leurs trajets : villes, date, kilos disponibles, **prix au kilo**, **délai de livraison**, **liste d'objets refusés** (modifiable).
- Les clients cherchent un trajet, voient le total de leur colis, envoient une demande avec une description et discutent avec le GP.
- Le numéro de téléphone n'est révélé qu'une fois la demande acceptée. Le paiement se fait directement entre eux, hors plateforme.
- Après livraison, le client note le GP (étoiles + avis).
- **Badge « GP vérifié »** : le GP envoie sa pièce d'identité, un administrateur la contrôle. La pièce est supprimée après la décision.
- **Historique** : chaque utilisateur retrouve toutes ses mises en relation passées (« Mes demandes » côté client, « Demandes reçues » côté GP).
- **Signalements** : clients et GP signalent une mauvaise expérience. L'administration répond, suspend un trajet ou un compte.
- **Administration** : tableau de bord, vérifications, signalements, trajets, demandes, utilisateurs (dont mot de passe temporaire), avis.
- Connexion par **numéro de téléphone + mot de passe** (pas de code SMS dans cette version).
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

1. Un serveur (VPS) en Europe avec Docker, par exemple chez Scaleway, OVH ou AWS Paris.
2. Un nom de domaine qui pointe vers le serveur.
3. Un reverse proxy HTTPS devant le port 3000 (Caddy est le plus simple : certificat automatique).
4. Dans `.env` : un vrai `POSTGRES_PASSWORD`, un `ADMIN_PASSWORD` solide, `APP_URL=https://votre-domaine`, et **retirez `ALLOW_INSECURE_COOKIE`** (mettez `ALLOW_INSECURE_COOKIE=` vide) pour que le cookie de session ne circule qu'en HTTPS.
5. Sauvegardes quotidiennes de la base : `docker compose exec db pg_dump -U gp gp > sauvegarde.sql`.

Exemple de `Caddyfile` :

```
votre-domaine.com {
    reverse_proxy localhost:3000
}
```

## Modifier les listes

Tout est dans `src/lib/constants.ts` : villes proposées, objets refusés par défaut, délais de livraison, types de colis, motifs de signalement, indicatifs téléphoniques.

## Brancher WhatsApp ou les SMS plus tard

Toutes les notifications (nouvelle demande, acceptation, refus, nouveau message, badge validé) passent par `src/lib/notify.ts`. Aujourd'hui elles s'écrivent dans les logs du serveur. Pour envoyer de vrais messages WhatsApp Business ou SMS, il suffit de remplacer le corps de cette fonction.

## Limites connues de cette première version

- La limite de tentatives de connexion est gardée en mémoire : elle suffit pour un seul serveur. Avec plusieurs serveurs, passez par Redis.
- La discussion se met à jour toutes les 5 secondes (pas de temps réel).
- Mot de passe oublié : un admin génère un mot de passe temporaire depuis « Utilisateurs », après avoir vérifié l'identité de la personne.
- Les mentions légales, CGU et la politique de confidentialité restent à rédiger (idéalement avec un avocat) et à ajouter au site.
