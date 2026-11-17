"use client";
import { useActionState } from "react";
import { changePassword, type FormState } from "@/app/auth-actions";
import { SubmitButton } from "./SubmitButton";

export function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePassword, {});
  return (
    <form action={action} className="card" key={state.ok ?? "pw"}>
      <h2>Changer de mot de passe</h2>
      <div className="field">
        <label htmlFor="current">Mot de passe actuel</label>
        <input id="current" name="current" type="password" autoComplete="current-password" required />
      </div>
      <div className="field">
        <label htmlFor="next">Nouveau mot de passe</label>
        <input id="next" name="next" type="password" autoComplete="new-password" minLength={6} required />
      </div>
      {state.error && <p className="err">{state.error}</p>}
      {state.ok && <p className="okmsg">{state.ok}</p>}
      <SubmitButton className="btn alt">Changer le mot de passe</SubmitButton>
    </form>
  );
}
