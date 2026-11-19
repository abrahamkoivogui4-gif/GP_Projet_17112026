"use client";
import { useActionState } from "react";
import { regenerateRecovery, type FormState } from "@/app/auth-actions";
import { RecoveryCode } from "./RecoveryCode";
import { SubmitButton } from "./SubmitButton";

export function RecoveryForm({ hasCode }: { hasCode: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(regenerateRecovery, {});
  if (state.code) return <RecoveryCode code={state.code} title="Nouveau code de récupération" />;
  return (
    <form action={action} className={`card${hasCode ? "" : " accent"}`}>
      <h2>Code de récupération</h2>
      <p>
        {hasCode
          ? "Perdu votre code ou envie d'en changer ? Créez-en un nouveau : l'ancien ne fonctionnera plus."
          : "Vous n'avez pas encore de code de récupération. Créez-le maintenant : il vous permettra de retrouver votre compte si vous oubliez votre mot de passe."}
      </p>
      <div className="field">
        <label htmlFor="rpw">Votre mot de passe</label>
        <input id="rpw" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error && <p className="err">{state.error}</p>}
      <SubmitButton className="btn alt">{hasCode ? "Créer un nouveau code" : "Créer mon code de récupération"}</SubmitButton>
    </form>
  );
}
