"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { login, register, type FormState } from "@/app/auth-actions";
import { COUNTRY_CODES } from "@/lib/constants";
import { RecoveryCode } from "./RecoveryCode";
import { SubmitButton } from "./SubmitButton";

/** Logo et accroche, à gauche sur ordinateur et en haut sur téléphone (comme la page de connexion Facebook). */
export function AuthBrand() {
  return (
    <div className="auth-brand">
      <span className="logo big">L</span>
      <b className="auth-name">Lilalink</b>
      <p>Avec Lilalink, envoyez vos colis entre la France et l&apos;Afrique avec des GP de confiance.</p>
    </div>
  );
}

/**
 * Connexion et inscription, organisées comme Facebook :
 * titre, champs simples, gros bouton, « Mot de passe oublié ? », puis « Créer un nouveau compte » en bas.
 */
export function AuthForm({ mode, next, adding }: { mode: "login" | "register"; next?: string; adding?: boolean }) {
  const isR = mode === "register";
  const [state, action] = useActionState<FormState, FormData>(isR ? register : login, {});
  const [show, setShow] = useState(false);
  const [role, setRole] = useState(state.values?.role ?? "client");
  const v = state.values ?? {};
  const params = new URLSearchParams();
  if (next) params.set("suite", next);
  if (adding) params.set("ajout", "1");
  const q = params.size ? `?${params}` : "";

  if (state.code)
    return (
      <div className="auth">
        <AuthBrand />
        <div className="auth-box">
          <RecoveryCode code={state.code} next={state.next} title="Compte créé" />
        </div>
      </div>
    );

  return (
    <div className="auth">
      <AuthBrand />
      <div className="auth-box">
        <form action={action} className="auth-form">
          <div>
            <h1 className="auth-title">{isR ? "Créer un nouveau compte" : adding ? "Ajouter un compte" : "Se connecter à Lilalink"}</h1>
            {isR && <p className="tag">C&apos;est rapide et gratuit.</p>}
            {adding && <p className="tag">Vous pourrez passer d&apos;un compte à l&apos;autre avec l&apos;icône de profil, en haut à droite.</p>}
          </div>
          {next && <input type="hidden" name="suite" value={next} />}

          {isR && (
            <>
              <label className="vh" htmlFor="name">
                Prénom et nom
              </label>
              <input id="name" name="name" type="text" autoComplete="name" required defaultValue={v.name} placeholder="Prénom et nom" />
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

          <div className="phone">
            <select name="cc" aria-label="Indicatif du pays" defaultValue={v.cc ?? "+33"}>
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <label className="vh" htmlFor="phone">
              Numéro de mobile
            </label>
            <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" required defaultValue={v.phone} placeholder="Numéro de mobile" />
          </div>

          <div className="pw">
            <label className="vh" htmlFor="password">
              {isR ? "Nouveau mot de passe" : "Mot de passe"}
            </label>
            <input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              autoComplete={isR ? "new-password" : "current-password"}
              required
              minLength={isR ? 6 : undefined}
              placeholder={isR ? "Nouveau mot de passe (6 caractères minimum)" : "Mot de passe"}
            />
            <button type="button" onClick={() => setShow(!show)}>
              {show ? "Masquer" : "Afficher"}
            </button>
          </div>
          {isR && (
            <>
              <label className="vh" htmlFor="password2">
                Confirmez le mot de passe
              </label>
              <input id="password2" name="password2" type={show ? "text" : "password"} autoComplete="new-password" required placeholder="Confirmez le mot de passe" />
            </>
          )}

          {state.error && (
            <p className="err" role="alert">
              {state.error}
            </p>
          )}
          <SubmitButton className="btn round">{isR ? "S'inscrire" : "Se connecter"}</SubmitButton>
          {!isR && (
            <Link href="/mot-de-passe-oublie" className="auth-forgot">
              Mot de passe oublié ?
            </Link>
          )}
        </form>

        {isR ? (
          <Link href={`/connexion${q}`} className="btn round outline">
            J&apos;ai déjà un compte
          </Link>
        ) : (
          <Link href={`/inscription${q}`} className="btn round outline">
            Créer un nouveau compte
          </Link>
        )}
        {adding && (
          <Link href="/" className="auth-forgot">
            Annuler
          </Link>
        )}
      </div>
    </div>
  );
}
