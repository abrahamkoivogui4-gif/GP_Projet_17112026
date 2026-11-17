"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { login, register, type FormState } from "@/app/auth-actions";
import { COUNTRY_CODES } from "@/lib/constants";
import { SubmitButton } from "./SubmitButton";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const isR = mode === "register";
  const [state, action] = useActionState<FormState, FormData>(isR ? register : login, {});
  const [show, setShow] = useState(false);
  const [role, setRole] = useState(state.values?.role ?? "client");
  const v = state.values ?? {};
  const q = next ? `?suite=${encodeURIComponent(next)}` : "";

  return (
    <form action={action} className="card">
      <div>
        <h1>{isR ? "Créer un compte" : "Se connecter"}</h1>
        <p className="tag">Avec votre numéro de téléphone et un mot de passe.</p>
      </div>
      <div className="seg" role="group" aria-label="Connexion ou inscription">
        <Link href={`/connexion${q}`} aria-current={!isR ? "page" : undefined}>
          Se connecter
        </Link>
        <Link href={`/inscription${q}`} aria-current={isR ? "page" : undefined}>
          Créer un compte
        </Link>
      </div>
      {next && <input type="hidden" name="suite" value={next} />}

      {isR && (
        <>
          <div className="field">
            <label htmlFor="name">Prénom et nom</label>
            <input id="name" name="name" type="text" autoComplete="name" required defaultValue={v.name} placeholder="Ex. Mamadou Diallo" />
          </div>
          <div className="field">
            <span className="label">Vous êtes</span>
            <input type="hidden" name="role" value={role} />
            <div className="chips">
              <button type="button" className="chip" aria-pressed={role === "client"} onClick={() => setRole("client")}>
                J&apos;envoie des colis
              </button>
              <button type="button" className="chip" aria-pressed={role === "gp"} onClick={() => setRole("gp")}>
                Je suis GP
              </button>
            </div>
          </div>
        </>
      )}

      <div className="field">
        <label htmlFor="phone">Numéro de téléphone</label>
        <div className="phone">
          <select name="cc" aria-label="Indicatif du pays" defaultValue={v.cc ?? "+33"}>
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" required defaultValue={v.phone} placeholder="06 12 34 56 78" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="password">Mot de passe</label>
        <div className="pw">
          <input id="password" name="password" type={show ? "text" : "password"} autoComplete={isR ? "new-password" : "current-password"} required minLength={isR ? 6 : undefined} />
          <button type="button" onClick={() => setShow(!show)}>
            {show ? "Masquer" : "Afficher"}
          </button>
        </div>
        {isR && <p className="hint">Au moins 6 caractères.</p>}
      </div>
      {isR && (
        <div className="field">
          <label htmlFor="password2">Confirmez le mot de passe</label>
          <input id="password2" name="password2" type={show ? "text" : "password"} autoComplete="new-password" required />
        </div>
      )}

      {state.error && (
        <p className="err" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton>{isR ? "Créer mon compte" : "Me connecter"}</SubmitButton>
      {!isR && (
        <p className="tag">
          Mot de passe oublié ? Contactez l&apos;équipe : après vérification de votre identité, un administrateur vous donnera un mot de passe temporaire.
        </p>
      )}
    </form>
  );
}
