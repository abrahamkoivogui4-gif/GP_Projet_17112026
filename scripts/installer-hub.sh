#!/usr/bin/env bash
# Installe (ou met à jour) le Business Hub sur ce serveur, à côté de Lilalink.
# Usage, en root : bash /home/ubuntu/lilalink/scripts/installer-hub.sh
set -euo pipefail

LILA=/home/ubuntu/lilalink
HUB=/home/ubuntu/hub
REPO=git@github-hub:abrahamkoivogui4-gif/business-hub.git
KEY=/root/.ssh/hub_deploy

vert() { printf '\n\033[1;32m%s\033[0m\n' "$*"; }
info() { printf '\033[1m%s\033[0m\n' "$*"; }
stop() { printf '\n\033[1;31m%s\033[0m\n' "$*"; exit 1; }

[ "$(id -u)" -eq 0 ] || stop "Lancez ce script en root : tapez « sudo -s » puis relancez-le."
[ -d "$LILA/caddy-extra" ] || stop "Lilalink n'est pas à jour. Lancez : cd $LILA && git pull   puis relancez ce script."

# 1. Clé d'accès au dépôt privé ------------------------------------------------
vert "Étape 1/4 — Accès au dépôt privé du Hub"
mkdir -p /root/.ssh && chmod 700 /root/.ssh
[ -f "$KEY" ] || ssh-keygen -q -t ed25519 -f "$KEY" -N "" -C "vps-hub"
grep -q "Host github-hub" /root/.ssh/config 2>/dev/null || printf 'Host github-hub\n  HostName github.com\n  User git\n  IdentityFile %s\n  IdentitiesOnly yes\n' "$KEY" >> /root/.ssh/config
ssh-keyscan -t ed25519 github.com >> /root/.ssh/known_hosts 2>/dev/null
until git ls-remote "$REPO" >/dev/null 2>&1; do
  echo
  info "Copiez cette clé (toute la ligne) :"
  echo
  cat "$KEY.pub"
  echo
  info "Puis sur GitHub : dépôt business-hub → Settings → Deploy keys → Add deploy key"
  info "Titre : VPS · collez la clé · NE cochez PAS « Allow write access » · Add key"
  read -r -p "Quand c'est fait, appuyez sur Entrée… " _
done
echo "Accès au dépôt : OK"

# 2. Code et réglages -----------------------------------------------------------
vert "Étape 2/4 — Code et réglages"
if [ -d "$HUB/.git" ]; then git -C "$HUB" pull --ff-only; else git clone -q "$REPO" "$HUB"; fi
if [ -f "$HUB/.env" ]; then
  echo "Réglages déjà présents ($HUB/.env) : je les garde."
else
  read -r -p "Votre e-mail de connexion : " EMAIL
  while :; do
    read -r -s -p "Choisissez votre mot de passe (12 caractères minimum) : " PW; echo
    [ "${#PW}" -ge 12 ] || { echo "Trop court, recommencez."; continue; }
    read -r -s -p "Retapez-le : " PW2; echo
    [ "$PW" = "$PW2" ] && break || echo "Les deux ne correspondent pas, recommencez."
  done
  while :; do
    read -r -s -p "Phrase secrète des sauvegardes (12 caractères minimum, NOTEZ-LA ailleurs) : " BK; echo
    [ "${#BK}" -ge 12 ] && break || echo "Trop court, recommencez."
  done
  umask 077
  printf 'HUB_EMAIL=%s\nHUB_PASSWORD=%s\nPOSTGRES_PASSWORD=%s\nBACKUP_PASSPHRASE=%s\n' "$EMAIL" "$PW" "$(openssl rand -hex 24)" "$BK" > "$HUB/.env"
  chmod 600 "$HUB/.env"
  echo "Réglages enregistrés."
fi

# 3. Démarrage du Hub -------------------------------------------------------------
vert "Étape 3/4 — Démarrage du Hub (quelques minutes)"
( cd "$HUB" && docker compose up -d --build --remove-orphans )

# 4. Branchement sur Caddy (HTTPS), vérifié avant tout redémarrage ---------------------
vert "Étape 4/4 — Adresse https://hub.lilalink.fr"
cp "$HUB/hub.caddy" "$LILA/caddy-extra/hub.caddy"
if docker run --rm -e DOMAIN=lilalink.fr -v "$LILA/Caddyfile:/etc/caddy/Caddyfile:ro" -v "$LILA/caddy-extra:/etc/caddy/extra:ro" \
     caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/tmp/hub-caddy-check.log 2>&1; then
  ( cd "$LILA" && docker compose -f docker-compose.prod.yml up -d caddy )
else
  rm -f "$LILA/caddy-extra/hub.caddy"
  tail -5 /tmp/hub-caddy-check.log
  stop "La configuration HTTPS n'est pas valide : rien n'a été changé, Lilalink tourne normalement. Envoyez ce message à Claude."
fi

if ! getent hosts hub.lilalink.fr >/dev/null; then
  info "Attention : hub.lilalink.fr n'existe pas encore dans le DNS. Ajoutez l'entrée A « hub » chez OVH ; le site s'ouvrira quelques minutes après."
fi
vert "Terminé ! Ouvrez https://hub.lilalink.fr et connectez-vous."
echo "Pour mettre à jour plus tard : relancez simplement ce même script."
