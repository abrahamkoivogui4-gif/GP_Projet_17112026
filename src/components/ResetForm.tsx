"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { resetPassword, type FormState } from "@/app/auth-actions";
import { COUNTRY_CODES } from "@/lib/constants";
import { RecoveryCode } from "./RecoveryCode";
import { SubmitButton } from "./SubmitButton";

export function ResetForm() {
  const [state, action] = useActionState<FormState, FormData>(resetPassword, {});
  const [show, setShow] = useState(false);
  const v = state.values ?? {};

  if (state.code) return <RecoveryCode code={state.code} next={state.next} title="Mot de passe modifié" />;

  return (
    <form action={action} className="card">
      <div>
        <h1>Mot de passe oublié</h1>
        <p className="tag">Entrez votre numéro, votre code de récupération (donné à la création du compte) et choisissez un nouveau mot de passe.</p>
      </div>
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
        <label htmlFor="code">Code de récupération</label>
        <input id="code" name="code" type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false} required placeholder="ABCD-EFGH-JKMN" />
      </div>
      <div className="field">
        <label htmlFor="password">Nouveau mot de passe</label>
        <div className="pw">
          <input id="password" name="password" type={show ? "text" : "password"} autoComplete="new-password" minLength={6} required />
          <button type="button" onClick={() => setShow(!show)}>
            {show ? "Masquer" : "Afficher"}
          </button>
        </div>
        <p className="hint">Au moins 6 caractères.</p>
      </div>
      <div className="field">
        <label htmlFor="password2">Confirmez le mot de passe</label>
        <input id="password2" name="password2" type={show ? "text" : "password"} autoComplete="new-password" required />
      </div>
      {state.error && (
        <p className="err" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton>Changer mon mot de passe</SubmitButton>
      <p className="tag">
        Vous n&apos;avez pas votre code ? Contactez l&apos;équipe : après vérification de votre identité, un administrateur vous donnera un mot de passe temporaire.
      </p>
      <Link href="/connexion" className="link">
        ← Retour à la connexion
      </Link>
    </form>
  );
}
