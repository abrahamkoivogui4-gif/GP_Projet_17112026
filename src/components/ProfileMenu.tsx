"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout, switchAccount, switchMode } from "@/app/auth-actions";
import { VerifiedBadge } from "./VerifiedBadge";

export type MenuAccount = { id: number; name: string; phone: string; verified: boolean; role: "client" | "gp" | "admin" };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span className="pm-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>
      {initials(name)}
    </span>
  );
}

/** Icône du profil en haut à droite : profil actif (expéditeur / GP), changement de compte, déconnexion. */
export function ProfileMenu({ me, mode, others }: { me: MenuAccount; mode: "client" | "gp"; others: MenuAccount[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const isGp = me.role === "gp" || me.role === "admin";

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div className="pm" ref={box}>
      <button type="button" className="pm-btn" aria-haspopup="true" aria-expanded={open} aria-label="Mon profil et changer de profil" onClick={() => setOpen(!open)}>
        <Avatar name={me.name} />
        {me.verified && (
          <span className="pm-btn-badge">
            <VerifiedBadge size={16} />
          </span>
        )}
        <span className="pm-switch-ico" aria-hidden>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="pm-panel" role="menu">
          <Link href="/compte" className="pm-me">
            <Avatar name={me.name} size={48} />
            <span>
              <b>
                {me.name} {me.verified && <VerifiedBadge size={16} />}
              </b>
              <small>Voir mon compte</small>
            </span>
          </Link>

          <div className="pm-sec">
            <span className="pm-title">Profil utilisé</span>
            <div className="pm-modes">
              <form action={switchMode}>
                <input type="hidden" name="mode" value="client" />
                <button type="submit" className="pm-mode" aria-pressed={mode === "client"}>
                  <span aria-hidden>📦</span>
                  <b>Expéditeur</b>
                  <small>J&apos;envoie des colis</small>
                </button>
              </form>
              <form action={switchMode}>
                <input type="hidden" name="mode" value="gp" />
                <button type="submit" className="pm-mode" aria-pressed={mode === "gp"}>
                  <span aria-hidden>✈️</span>
                  <b>GP</b>
                  <small>{isGp ? "Je transporte" : "Devenir GP"}</small>
                </button>
              </form>
            </div>
          </div>

          <div className="pm-sec">
            <span className="pm-title">Changer de compte</span>
            {others.map((a) => (
              <form action={switchAccount} key={a.id}>
                <input type="hidden" name="userId" value={a.id} />
                <button type="submit" className="pm-row">
                  <Avatar name={a.name} size={36} />
                  <span>
                    <b>
                      {a.name} {a.verified && <VerifiedBadge size={14} />}
                    </b>
                    <small>{a.role === "gp" ? "GP" : a.role === "admin" ? "Administrateur" : "Expéditeur"}</small>
                  </span>
                </button>
              </form>
            ))}
            <Link href="/connexion?ajout=1" className="pm-row">
              <span className="pm-plus" aria-hidden>
                +
              </span>
              <span>
                <b>Ajouter un compte</b>
                <small>Se connecter avec un autre numéro</small>
              </span>
            </Link>
          </div>

          <div className="pm-sec">
            <Link href="/alertes" className="pm-link">
              🔔 Alertes WhatsApp
            </Link>
            <Link href="/compte" className="pm-link">
              ⚙️ Mon compte et mot de passe
            </Link>
            <form action={logout}>
              <button type="submit" className="pm-link">
                ↪ Se déconnecter
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
